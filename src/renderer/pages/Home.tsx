import {
  Box,
  Card,
  CardBody,
  Center,
  Divider,
  Heading,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import FilePicker from 'chakra-ui-file-picker';
import { useNavigate } from 'react-router-dom';
import postgres from '../../../assets/postgres.png';

function Home() {
  const navigate = useNavigate();
  const handleFileChange = (files: File[]) => {
    navigate('/graph', { state: { files } });
  };

  const handleExportedFileChange = (files: File[]) => {
    const exportedFile = files[0];

    navigate('/graph', { state: { exportedFile } });
  };

  return (
    <Center height="100vh" bgGradient="linear(to-br, blue.800, blue.100)">
      <VStack padding={4} spacing={4} align="stretch">
        <HStack>
          <Image height={8} src={postgres} />
          <Heading size="lg" color="white">
            PostgreSQL Log Analyzer
          </Heading>
        </HStack>
        <Card shadow="2xl">
          <CardBody>
            <VStack spacing={2} align="flex-start">
              <Text>Generate graph from a log file</Text>
              <FilePicker
                placeholder="No file chosen"
                onFileChange={handleFileChange}
                hideClearButton
                accept=".csv"
                multipleFiles
              />
              <Text fontSize="xs" textColor="GrayText">
                CSV files are supported
              </Text>
              <Divider />
              <Text>Open exported graph</Text>
              <FilePicker
                placeholder="No file chosen"
                onFileChange={handleExportedFileChange}
                hideClearButton
                accept=".json"
              />
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Center>
  );
}

export default Home;
