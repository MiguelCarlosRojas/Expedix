import React from 'react';
import { Button, ButtonProps } from '@mantine/core';

export interface CustomButtonProps extends ButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  icon,
  children,
  onClick,
  ...props
}) => {
  return (
    <Button
      leftSection={icon}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};
