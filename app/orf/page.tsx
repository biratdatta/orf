import { Container, CssBaseline, Typography, Box } from '@mui/material';
import AudioRecorder from '../../components/AudioManager';  

const Home = () => {
  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
     <Box sx={{ marginTop: 6 }}>
      <Typography variant="h4" align="center">ORF DEMO APPLICATION  </Typography>
      <Box sx={{ marginTop: 6 }}> </Box>
        <AudioRecorder />
      </Box>
    </Container>
  );
};

export default Home;
