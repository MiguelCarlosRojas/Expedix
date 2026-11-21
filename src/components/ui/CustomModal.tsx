import React from 'react';
import { Modal, ModalProps } from '@mantine/core';

export interface CustomModalProps extends ModalProps {
  children: React.ReactNode;
}

export const CustomModal: React.FC<CustomModalProps> = ({ children, ...props }) => {
  return (
    <Modal
      centered
      shadow="lg"
      transitionProps={{ transition: 'fade-down', duration: 200 }}
      {...props}
    >
      {children}
    </Modal>
  );
};
