import { useEffect, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import CytoscapeComponent from 'react-cytoscapejs';
import { ElementDefinition } from 'cytoscape';
import { pipe, replace } from 'ramda';
import { Button, VStack, Heading, HStack } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { ExcludedPhrases } from 'renderer/comoponents';

const STATEMENT_COL = 13;
const SESSION_COL = 3;
const LOG_TYPE_COL = 10;

function Graph() {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [excludedPhrases, setExcludedPhrases] = useState<string[]>([
    'pg_database',
  ]);
  const { state } = useLocation();
  const navigate = useNavigate();

  const transformData = (data: ParseResult<string[]>) => {
    const nodes: ElementDefinition[] = [];
    const edges: ElementDefinition[] = [];
    let lastSession: string | undefined;

    data.data.forEach((row) => {
      let statement = row[STATEMENT_COL];
      const session = row[SESSION_COL];

      if (!statement?.includes('statement:')) return;

      statement = pipe(
        replace('statement:', ''),
        replace(/'(.*?)'|\d/g, '?')
      )(statement);

      if (nodes[nodes.length - 1]?.data.id && session === lastSession)
        edges.push({
          data: {
            source: nodes[nodes.length - 1].data.id,
            target: statement,
          },
        });

      nodes.push({
        data: {
          id: statement,
          label: statement,
        },
      });

      lastSession = session;
    });

    setElements([...nodes, ...edges]);
  };

  const getFilteredElements = () =>
    elements.filter((element) =>
      excludedPhrases.every((phrase) => !element.data.label?.includes(phrase))
    );

  useEffect(() => {
    Papa.parse(state.file, {
      complete: transformData,
    });
  }, [state]);

  return (
    <VStack padding={4} spacing={4} align="flex-start" overflow="hidden">
      <HStack>
        <Button
          size="sm"
          onClick={() => navigate('/')}
          leftIcon={<ArrowBackIcon />}
        >
          Go back
        </Button>
        <Heading size="md">{state.file.name}</Heading>
      </HStack>
      <ExcludedPhrases
        excludedPhrases={excludedPhrases}
        onExcludePhrasesChange={setExcludedPhrases}
      />
      {elements.length && (
        <CytoscapeComponent
          layout={{
            name: 'cose',
            animate: true,
            componentSpacing: 100,
          }}
          elements={getFilteredElements()}
          style={{ width: '100vw', height: '100vh' }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                backgroundColor: '#4299E1',
              },
            },
            {
              selector: 'edge',
              style: {
                'mid-target-arrow-shape': 'triangle',
                width: 2,
              },
            },
          ]}
        />
      )}
    </VStack>
  );
}

export default Graph;
