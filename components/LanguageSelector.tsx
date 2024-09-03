"use client"

import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';

const LanguageSelector: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    // Redirect based on the language selected
    if (language === 'English') {
      router.push('/english-page');
    } else if (language === 'Hindi') {
      router.push('/hindi-page');
    }
    handleClose();
  };

  return (
    <div>
      <Button 
        aria-controls="language-menu" 
        aria-haspopup="true" 
        onClick={handleClick}
        variant="contained" 
        color="primary"
      >
        Choose your language
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleLanguageChange('English')}>English</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('Hindi')}>Hindi</MenuItem>
      </Menu>
    </div>
  );
};

export default LanguageSelector;
