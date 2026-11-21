import React from 'react';
import { TextInput, TextInputProps } from '@mantine/core';

export const CustomInput: React.FC<TextInputProps> = (props) => {
  return <TextInput {...props} />;
};
