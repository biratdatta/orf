"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';

const LanguageSelector: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuWidth, setMenuWidth] = useState<number>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    
    // Redirect based on the language selected
    /* TODO: Configure this path to route to the desired language which will be required by the Model */
    if (language === 'English') {
      router.push('/orf');
    } else if (language === 'Hindi') {
      router.push('/orf');
    }
    handleClose();
  };

  useEffect(() => {
    if (buttonRef.current && anchorEl) {
      setMenuWidth(buttonRef.current.clientWidth);
    }
  }, [anchorEl]);

  return (
    <div>
      <Button 
        aria-controls="language-menu" 
        aria-haspopup="true" 
        onClick={handleClick}
        variant="outlined"
        color="primary"
        sx={{ 
          backgroundColor: 'transparent', 
          borderColor: 'primary.main', 
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }
        }}
        ref={buttonRef}
      >
        Choose your language
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            width: menuWidth,
          },
        }}
      >
        <MenuItem onClick={() => handleLanguageChange('English')}>English</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('Hindi')}>Hindi</MenuItem>
      </Menu>
    </div>
  );
};

export default LanguageSelector;
