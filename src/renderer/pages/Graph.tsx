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
  Divider,
  SlideFade,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowBackIcon,
  DownloadIcon,
  RepeatIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import { ExcludedPhrases, SettingsDrawer } from 'renderer/comoponents';
import { add, forEach } from 'ramda';
import fcose from 'cytoscape-fcose';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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

const hasFiles = (
  state:
    | {
        files: File[];
      }
    | {
        exportedFile: File;
      }
): state is { files: File[] } => 'files' in state;

function Graph() {
  const [isLoading, setIsLoading] = useState(true);
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [excludedPhrases, setExcludedPhrases] = useState<string[]>([
    'pg_database',
    'BEGIN',
  ]);
  const { state } = useLocation() as {
    state: { files: File[] } | { exportedFile: File };
  };
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [highlightedEdge, setHighlightedEdge] = useState<
    (EdgeDataDefinition & { label: string }) | undefined
  >();
  const { settings } = useSettings();
  const [key, forceRefresh] = useReducer(add(1), 0);

  const transformData = (
    data: string[][],
    isTransactionView: boolean,
    threshold: number,
    multiplier: number
  ) => {
    let nodes: ElementDefinition[] = [];
    let edges: ElementDefinition[] = [];

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
      }))
      .sort((a, b) => a.session.localeCompare(b.session));

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

      // Create node if it doesn't exist. If it does, increment weight.
      if (!nodes.find((node) => node.data.id === log.statement)) {
        nodes.push({
          data: {
            id: log.statement,
            weight: 1,
            label:
              log.statement?.length > 50
                ? `${log.statement.slice(0, 50)} ...`
                : log.statement,
          },
        });
      } else {
        const nodeIndex = nodes.findIndex(
          (node) => node.data.id === log.statement
        );
        nodes[nodeIndex].data.weight += 1;
      }
    });

    // Filter out edges with weight lower than threshold
    if (threshold)
      edges = edges.filter((edge) => edge.data.weight >= threshold);

    // Filter out nodes that are not connected to any edge
    nodes = nodes.filter((node) =>
      edges.some(
        (edge) =>
          edge.data.source === node.data.id || edge.data.target === node.data.id
      )
    );

    // Normalize edge weights
    const highestWeight = Math.max(
      ...edges.map((edge) => edge.data.weight as number)
    );
    edges.forEach((edge) => {
      edge.data.weight = edge.data.weight / highestWeight + 0.5;
      return edge;
    });

    // Normalize node weights
    const highestNodeWeight = Math.max(
      ...nodes.map((node) => node.data.weight as number)
    );
    nodes.forEach((node) => {
      node.data.weight =
        (node.data.weight / highestNodeWeight) * multiplier + 10;
      return node;
    });

    setElements([...nodes, ...edges]);
    setIsLoading(false);
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
    if ('files' in state) {
      Promise.all(
        state.files.map(
          (file) =>
            new Promise<ParseResult<string[]>>((resolve, reject) =>
              Papa.parse(file, {
                complete: resolve, // Resolve each promise
                error: reject,
              })
            )
        )
      )
        .then((results) => {
          const allData = results.flatMap((result) => result.data);

          transformData(
            allData.filter((row) =>
              excludedPhrases.every(
                (phrase) => !row[STATEMENT_COL]?.includes(phrase)
              )
            ),
            settings.isTransactionView,
            settings.threshold,
            settings.nodeMultiplier
          );

          return forceRefresh();
        })
        .catch((err) => console.error(err));
    } else {
      const fileReader = new FileReader();
      fileReader.readAsText(state.exportedFile);
      fileReader.onload = (event) =>
        typeof event?.target?.result === 'string' &&
        setElements(JSON.parse(event?.target?.result));
    }
  }, [
    excludedPhrases,
    settings.isTransactionView,
    settings.nodeMultiplier,
    settings.threshold,
    state,
  ]);

  return (
    <VStack height="100vh" padding={4} spacing={4} align="flex-start">
      <HStack justifyContent="space-between" width="100%">
        <HStack>
          <Box>
            <Button
              size="sm"
              onClick={() => navigate('/')}
              leftIcon={<ArrowBackIcon />}
            >
              Go back
            </Button>
          </Box>
          <Heading size="md" noOfLines={1}>
            {hasFiles(state)
              ? state.files.map((file) => file.name).join(', ')
              : state.exportedFile.name}
          </Heading>
        </HStack>
        <HStack>
          <Button
            size="sm"
            onClick={handleDownload}
            leftIcon={<DownloadIcon />}
            isDisabled={!hasFiles(state)}
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
      {hasFiles(state) && (
        <ExcludedPhrases
          excludedPhrases={excludedPhrases}
          onExcludePhrasesChange={setExcludedPhrases}
        />
      )}
      <Box height="full" overflow="hidden">
        <SlideFade in={!!highlightedEdge}>
          {highlightedEdge && (
            <Box position="absolute" zIndex={10} marginRight={4}>
              <Card backgroundColor="gray.200">
                <CardBody>
                  <VStack spacing={2} align="start">
                    <Heading size="xs">Source</Heading>
                    <SyntaxHighlighter
                      language="sql"
                      style={docco}
                      wrapLongLines
                      customStyle={{
                        fontSize: 14,
                        maxHeight: 116,
                        width: '100%',
                      }}
                    >
                      {highlightedEdge.target}
                    </SyntaxHighlighter>
                    <Heading size="xs">Target</Heading>
                    <SyntaxHighlighter
                      language="sql"
                      style={docco}
                      wrapLongLines
                      customStyle={{
                        fontSize: 14,
                        maxHeight: 116,
                        width: '100%',
                      }}
                    >
                      {highlightedEdge.source}
                    </SyntaxHighlighter>
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
        </SlideFade>
        {elements.length ? (
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
              height: hasFiles(state)
                ? 'calc(100vh - 261px)'
                : 'calc(100vh - 78px)',
              width: 'calc(100vw - 32px)',
            }}
            stylesheet={[
              {
                selector: 'node',
                style: {
                  label: 'data(label)',
                  backgroundColor: '#4299E1',
                  'font-size': settings.fontSize,
                  width: 'data(weight)',
                  height: 'data(weight)',
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
        ) : (
          <Center height="full" width="100vw">
            {isLoading ? (
              <Spinner size="lg" color="blue.500" />
            ) : (
              <p>No data</p>
            )}
          </Center>
        )}
      </Box>
      <SettingsDrawer
        isReadOnly={!hasFiles(state)}
        isOpen={isOpen}
        onClose={onClose}
      />
    </VStack>
  );
}

export default Graph;
