import {
  Box,
  Card,
  CardBody,
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
    const file = files[0];

    navigate('/graph', { state: { file } });
  };

  return (
    <VStack padding={4} spacing={4} align="stretch">
      <HStack>
        <Image height={8} src={postgres} />
        <Heading size="lg">PostgreSQL Log Analyzer</Heading>
      </HStack>
      <Card>
        <CardBody>
          <VStack spacing={2} align="flex-start">
            <Text>To begin, open a log file</Text>
            <FilePicker
              placeholder="No file chosen"
              onFileChange={handleFileChange}
              hideClearButton
              accept=".csv, .json"
            />
            <Text fontSize="xs" textColor="GrayText">
              CSV files are supported
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

export default Home;
