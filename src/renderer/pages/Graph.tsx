import { useEffect, useReducer, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape, { EdgeDataDefinition, ElementDefinition } from 'cytoscape';
import {
  Button,
  VStack,
  Heading,
  HStack,
  useDisclosure,
  Box,
  Card,
  CardBody,
  Text,
  ScaleFade,
  Divider,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowBackIcon,
  DownloadIcon,
  RepeatIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { ExcludedPhrases, SettingsDrawer } from 'renderer/comoponents';
import { add } from 'ramda';
import fcose from 'cytoscape-fcose';

import { useSettings } from '../contexts';

Cytoscape.use(fcose);

const STATEMENT_COL = 13;
const SESSION_COL = 3;
const TRANSACTION_COL = 9;

// type Edge = {
//   source: string; // ID počátčního vrhcolu
//   target: string; // ID koncového vrcholu
//   weight: number; // Váha hrany
//   isTransaction: boolean; // Zda se jedná o transakci
// };

// type Node = {
//   id: string; // ID vrcholu (SQL dotaz)
//   label: string; // Popisek vrcholu
// };

function Graph() {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [excludedPhrases, setExcludedPhrases] = useState<string[]>([
    'pg_database',
    'BEGIN',
  ]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [highlightedEdge, setHighlightedEdge] = useState<
    (EdgeDataDefinition & { label: string }) | undefined
  >();
  const { settings } = useSettings();
  const [key, forceRefresh] = useReducer(add(1), 0);

  const transformData = (data: string[][], isTransactionView: boolean) => {
    const nodes: ElementDefinition[] = [];
    const edges: ElementDefinition[] = [];

    // Filter out non-statement rows and replace values with '?'
    let logData = data
      .filter(
        (row) =>
          row[STATEMENT_COL]?.includes('statement: ') ||
          row[STATEMENT_COL]?.includes('execute')
      )
      .map((row) => ({
        statement: row[STATEMENT_COL]?.replace(
          /.*statement: |.*execute.*?: /,
          ''
        ).replace(/\( \$\d+ \)|'(.*?)'|(?<= |=|\(|,)\d+/g, '?'),
        session: row[SESSION_COL],
        transaction: row[TRANSACTION_COL],
      }));

    // If transaction view is enabled, replace statement with 'T:statement' if it is part of a transaction.
    if (isTransactionView)
      logData = logData.map((log, index) =>
        logData.some(
          (_log, _index) =>
            log.transaction === _log.transaction && index !== _index
        )
          ? { ...log, statement: `T:${log.statement}` }
          : log
      );

    logData.forEach((log, index) => {
      // Find edge if it already exists.
      const edgeIndex = edges.findIndex(
        (edge) =>
          edge.data.source === log.statement &&
          edge.data.target === logData[index - 1]?.statement
      );

      // If edge exists, increment weight. If weight is higher than highest weight, update highest weight.
      if (edgeIndex !== -1) {
        edges[edgeIndex].data.weight += 1;
        edges[edgeIndex].data.label = edges[edgeIndex].data.weight.toString();
        return;
      }

      // If the previous statement was from the same session, create an edge.
      if (log.session === logData[index - 1]?.session)
        edges.push({
          data: {
            source: log.statement,
            target: logData[index - 1]?.statement,
            weight: 1,
            label: '1',
            isTransaction:
              isTransactionView &&
              log.transaction === logData[index - 1]?.transaction,
          },
        });

      // Create node if it doesn't exist.
      if (!nodes.find((node) => node.data.id === log.statement)) {
        nodes.push({
          data: {
            id: log.statement,
            label:
              log.statement?.length > 50
                ? `${log.statement.slice(0, 50)} ...`
                : log.statement,
          },
        });
      }
    });

    // Normalize edge weights
    const highestWeight = Math.max(
      ...edges.map((edge) => edge.data.weight as number)
    );
    edges.map((edge) => {
      edge.data.weight = edge.data.weight / highestWeight + 0.5;
      return edge;
    });

    setElements([...nodes, ...edges]);
  };

  const handleDownload = () => {
    const data = JSON.stringify(elements);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'graph.json';
    link.href = url;
    link.click();
  };

  // Load data from provided file
  useEffect(() => {
    if (state.file)
      Papa.parse(state.file, {
        complete: (results: ParseResult<string[]>) => {
          transformData(
            results.data.filter((row) =>
              excludedPhrases.every(
                (phrase) => !row[STATEMENT_COL]?.includes(phrase)
              )
            ),
            settings.isTransactionView
          );
          forceRefresh();
        },
      });
    else {
      const fileReader = new FileReader();
      fileReader.readAsText(state.exportedFile);
      fileReader.onload = (event) =>
        typeof event?.target?.result === 'string' &&
        setElements(JSON.parse(event?.target?.result));
    }
  }, [excludedPhrases, settings.isTransactionView, state]);

  return (
    <VStack padding={4} spacing={4} align="flex-start">
      <HStack justifyContent="space-between" width="100%">
        <HStack>
          <Button
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowBackIcon />}
          >
            Go back
          </Button>
          <Heading size="md">
            {state.file?.name ?? state.exportedFile.name}
          </Heading>
        </HStack>
        <HStack>
          <Button
            size="sm"
            onClick={handleDownload}
            leftIcon={<DownloadIcon />}
            isDisabled={!state.file}
          >
            Export graph
          </Button>
          <Button size="sm" onClick={forceRefresh} leftIcon={<RepeatIcon />}>
            Refresh
          </Button>
          <Button size="sm" onClick={onOpen} leftIcon={<SettingsIcon />}>
            Settings
          </Button>
        </HStack>
      </HStack>
      {state.file && (
        <ExcludedPhrases
          excludedPhrases={excludedPhrases}
          onExcludePhrasesChange={setExcludedPhrases}
        />
      )}
      <Box overflow="hidden">
        <ScaleFade in={!!highlightedEdge}>
          {highlightedEdge && (
            <Box
              position="absolute"
              zIndex={10}
              backgroundColor="white"
              marginRight={4}
            >
              <Card backgroundColor="gray.200">
                <CardBody>
                  <VStack spacing={1} align="start">
                    <HStack>
                      <Heading size="xs">Source:</Heading>
                      <Heading size="xs" fontWeight="normal">
                        {highlightedEdge.target}
                      </Heading>
                    </HStack>
                    <HStack>
                      <Heading size="xs">Target:</Heading>
                      <Heading size="xs" fontWeight="normal">
                        {highlightedEdge.source}
                      </Heading>
                    </HStack>
                    <Divider />
                    <Text fontSize="sm">
                      This sequence occured {highlightedEdge.label} times
                    </Text>
                    {highlightedEdge.isTransaction && (
                      <Text fontSize="sm" color="blue.600">
                        This sequence occured in a transaction
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}
        </ScaleFade>
        {elements.length && (
          <CytoscapeComponent
            key={key}
            cy={(cy) => {
              cy.on('tap', 'edge', (event) => {
                setHighlightedEdge(event.target.data());
              });
              cy.on('tap', (event) => {
                if (event.target === cy) setHighlightedEdge(undefined);
              });
            }}
            layout={{ name: settings.layout }}
            elements={elements}
            style={{
              height: state.file ? 'calc(100vh - 261px)' : 'calc(100vh - 78px)',
              width: 'calc(100vw - 32px)',
            }}
            stylesheet={[
              {
                selector: 'node',
                style: {
                  label: 'data(label)',
                  backgroundColor: '#4299E1',
                  'font-size': settings.fontSize,
                  width: 10,
                  height: 10,
                  'font-weight': 'bold',
                },
              },
              {
                selector: 'edge',
                style: {
                  'line-color': (node) =>
                    node.data('isTransaction') ? '#7fb3dd' : '#b3b3b3',
                  'mid-source-arrow-color': (node) =>
                    node.data('isTransaction') ? '#7fb3dd' : '#b3b3b3',
                  'mid-source-arrow-shape': 'triangle',
                  'arrow-scale': 0.5,
                  width: 'data(weight)',
                  'curve-style': 'bezier',
                  opacity: 0.7,
                },
              },
            ]}
          />
        )}
      </Box>
      <SettingsDrawer
        isTransactionViewDisabled={!!state.exportedFile}
        isOpen={isOpen}
        onClose={onClose}
      />
    </VStack>
  );
}

export default Graph;
