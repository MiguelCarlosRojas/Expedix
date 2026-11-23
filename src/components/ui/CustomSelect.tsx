import React from 'react';
import { Select, SelectProps } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

export const CustomSelect: React.FC<SelectProps> = (props) => {
  return (
    <Select
      checkIconPosition="right"
      rightSection={props.rightSection ?? <IconChevronDown size={16} color="#16a34a" />}
      {...props}
    />
  );
};
