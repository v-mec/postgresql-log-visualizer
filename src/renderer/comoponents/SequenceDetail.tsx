import {
  Box,
  Card,
  CardBody,
  Divider,
  Heading,
  VStack,
  Text,
} from '@chakra-ui/react';
import { EdgeDataDefinition } from 'cytoscape';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface SequenceDetailProps {
  edgeData: EdgeDataDefinition & { label: string; isTransaction: boolean };
}

function SequenceDetail({ edgeData }: SequenceDetailProps) {
  return (
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
              {edgeData.target}
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
              {edgeData.source}
            </SyntaxHighlighter>
            <Divider />
            <Text fontSize="sm">
              This sequence occured {edgeData.label} times
            </Text>
            {edgeData.isTransaction && (
              <Text fontSize="sm" color="blue.600">
                This sequence occured in a transaction
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}

export default SequenceDetail;
