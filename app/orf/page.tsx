 
import { Container, CssBaseline, Typography } from '@mui/material';
import AudioRecorder from '../../components/AudioRecorder';  

const Home = () => {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography variant="h4" align="center">ORF App</Typography>
      <AudioRecorder />
    </Container>
  );
};

export default Home;
