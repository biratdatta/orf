import { Container, Typography, Box } from '@mui/material';
import LanguageSelector from '../components/LanguageSelector';

const Home = () => {
  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        px: 2,   
      }}
    >
      <Box
        sx={{
          border: '1px solid #ddd',
          borderRadius: 2,
          padding: 4,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 500,  
          minWidth: 500,   
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome to ORF Test Page
        </Typography>
        <LanguageSelector />
      </Box>
    </Container>
  );
};

export default Home;
