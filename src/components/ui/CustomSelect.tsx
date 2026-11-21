import React from 'react';
import { Select, SelectProps } from '@mantine/core';

export const CustomSelect: React.FC<SelectProps> = (props) => {
  return <Select checkIconPosition="right" {...props} />;
};
