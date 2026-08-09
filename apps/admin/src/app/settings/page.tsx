'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
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
import { adminApi } from '@/lib/api';

interface SettingRow {
  key: string;
  value: unknown;
  description?: string;
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    void adminApi.admin.settings().then((rows) => {
      setSettings(rows);
      setValues(Object.fromEntries(rows.map((row) => [row.key, String(row.value)])));
    });
  }, []);

  const save = async (key: string) => {
    let parsed: unknown = values[key];
    if (parsed === 'true') parsed = true;
    else if (parsed === 'false') parsed = false;
    await adminApi.admin.updateSetting({ key, value: parsed });
    toast.success(`Saved ${key}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System settings</h1>
        <p className="text-sm text-muted-foreground">
          Runtime configuration stored in the database
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.key} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="font-mono">{setting.key}</Label>
                <Input
                  value={values[setting.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                  }
                  className="font-mono"
                />
                {setting.description && (
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                )}
              </div>
              <Button variant="outline" onClick={() => void save(setting.key)}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
