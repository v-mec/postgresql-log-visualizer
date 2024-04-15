import { Tooltip, VStack, Text, Flex } from '@chakra-ui/react';

function HelpTooltip() {
  return (
    <Tooltip
      placement="left-start"
      label={
        <VStack>
          <Text>
            Click on an edge to display information about the sequence.
          </Text>
          <Text>
            Click on a node to cycle through all connections containing the
            node.
          </Text>
        </VStack>
      }
    >
      <Flex
        zIndex={10}
        pos="absolute"
        right={4}
        bottom={4}
        background="blue.500"
        rounded="full"
        h={10}
        w={10}
        justify="center"
        align="center"
      >
        <Text fontWeight="bold" color="white" cursor="default">
          ?
        </Text>
      </Flex>
    </Tooltip>
  );
}

export default HelpTooltip;
