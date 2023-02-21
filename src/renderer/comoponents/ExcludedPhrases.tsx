import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  VStack,
  Input,
  Kbd,
  Text,
  HStack,
  Tag,
  TagCloseButton,
  TagLabel,
} from '@chakra-ui/react';
import { FormEvent, useState } from 'react';

interface ExcludePhrasesProps {
  excludedPhrases: string[];
  onExcludePhrasesChange: (phrases: string[]) => void;
}

function ExcludedPhrases(props: ExcludePhrasesProps) {
  const [input, setInput] = useState('');
  const { excludedPhrases, onExcludePhrasesChange } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInput('');
    onExcludePhrasesChange([...excludedPhrases, input]);
  };

  const handleRemove = (index: number) => {
    const newPhrases = excludedPhrases.filter((_, i) => i !== index);
    onExcludePhrasesChange(newPhrases);
  };

  return (
    <Card width="100%">
      <CardHeader>
        <Heading size="sm">Ignored phrases</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={2} align="start">
          <HStack>
            <form onSubmit={handleSubmit}>
              <Input
                type="text"
                width={72}
                placeholder="Enter a phrase to be ignored"
                fontSize="sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </form>
            {excludedPhrases.map((phrase, index) => (
              <Tag
                key={phrase}
                borderRadius="full"
                variant="solid"
                colorScheme="blue"
              >
                <TagLabel>{phrase}</TagLabel>
                <TagCloseButton onClick={() => handleRemove(index)} />
              </Tag>
            ))}
          </HStack>
          <Text fontSize="xs" textColor="GrayText">
            Press <Kbd>Enter</Kbd> after each phrase
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}

export default ExcludedPhrases;
