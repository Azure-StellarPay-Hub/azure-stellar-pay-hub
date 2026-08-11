'use client';

import { useEffect, useState } from 'react';
import { Star, Trash2, UserPlus } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  useToast,
} from '@stellar-pay/ui';
import { api } from '@/lib/api';
import { shortKey } from '@/lib/format';
import type { Contact } from '@stellar-pay/types';

export default function ContactsPage() {
  const toast = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [memo, setMemo] = useState('');

  const load = () =>
    void api.users
      .contacts()
      .then((res) => setContacts(res.data))
      .catch(() => undefined);

  useEffect(load, []);

  const add = async () => {
    try {
      await api.users.createContact({ name, publicKey, memo: memo || undefined });
      setName('');
      setPublicKey('');
      setMemo('');
      toast.success('Contact added');
      load();
    } catch (err) {
      toast.error('Could not add contact', (err as Error).message);
    }
  };

  const remove = async (id: string) => {
    await api.users.deleteContact(id);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Address book</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved contacts, favorites and beneficiaries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alice" />
            </div>
            <div className="space-y-1.5">
              <Label>Public key</Label>
              <Input
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="G..."
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Memo (optional)</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="invoice"
              maxLength={28}
            />
          </div>
          <Button onClick={() => void add()}>
            <UserPlus className="h-4 w-4" /> Add contact
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No contacts yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    {contact.isFavorite && (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {shortKey(contact.publicKey)} {contact.memo ? `· ${contact.memo}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void remove(contact.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
