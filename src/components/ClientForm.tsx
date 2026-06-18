import React from 'react';
import { MasterClient } from '../types';
import { PointForm } from './PointForm';

interface ClientFormProps {
  client: Partial<MasterClient>;
  isNew: boolean;
  onSave: (client: MasterClient) => void;
  onCancel: () => void;
  onDelete?: (clientId: string) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, isNew, onSave, onCancel, onDelete }) => {
  return (
    <PointForm
      point={client}
      isNew={isNew}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={onDelete}
    />
  );
};
export default ClientForm;
