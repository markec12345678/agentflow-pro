'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import {
  GitBranch,
  GitCommit,
  GitCompare,
  RotateCcw,
  Trash2,
  Clock,
  User,
  FileText,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/web/components/ui/dialog';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import { Textarea } from '@/web/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/web/components/ui/select';

interface WorkflowVersion {
  id: string;
  versionNumber: number;
  name: string;
  description?: string;
  changeSummary?: string;
  changeType: 'major' | 'minor' | 'patch';
  isCurrent: boolean;
  createdBy: string;
  createdAt: string;
  parentVersionId?: string;
}

interface WorkflowVersioningProps {
  workflowId: string;
  currentVersion: number;
  onRollback?: (version: number) => void;
}

export default function WorkflowVersioning({
  workflowId,
  currentVersion,
  onRollback,
}: WorkflowVersioningProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const [newVersionData, setNewVersionData] = useState({
    name: '',
    description: '',
    changeSummary: '',
    changeType: 'minor' as 'major' | 'minor' | 'patch',
  });

  useEffect(() => {
    loadVersions();
  }, [workflowId]);

  const loadVersions = async () => {
    try {
      const res = await fetch(`/api/v1/workflows/${workflowId}/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (error) {
      logger.error('Failed to load versions:', error);
      toast.error('Napaka pri nalaganju verzij');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const res = await fetch(`/api/v1/workflows/${workflowId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVersionData),
      });

      if (!res.ok) throw new Error('Failed to create version');

      toast.success('Verzija ustvarjena');
      setCreateDialogOpen(false);
      loadVersions();
      setNewVersionData({
        name: '',
        description: '',
        changeSummary: '',
        changeType: 'minor',
      });
    } catch (error) {
      toast.error('Napaka pri ustvarjanju verzije');
    }
  };

  const handleRollback = async (versionNumber: number) => {
    try {
      const res = await fetch(
        `/api/v1/workflows/${workflowId}/versions/${versionNumber}/rollback`,
        { method: 'POST' }
      );

      if (!res.ok) throw new Error('Rollback failed');

      toast.success(`Rollback na verzijo ${versionNumber} uspešen`);
      setRollbackDialogOpen(false);
      onRollback?.(versionNumber);
      loadVersions();
    } catch (error) {
      toast.error('Napaka pri rollbacku');
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-500';
      case 'minor':
        return 'bg-yellow-500';
      case 'patch':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Nalaganje verzij...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Verzije Workflowa
            </CardTitle>
            <CardDescription>
              Trenutna verzija: v{currentVersion}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <GitCompare className="w-4 h-4 mr-2" />
                  Primerjaj
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Primerjava Verzij</DialogTitle>
                  <DialogDescription>
                    Izberite dve verziji za primerjavo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Verzija 1</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Izberi verzijo" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map(v => (
                          <SelectItem key={v.id} value={v.versionNumber.toString()}>
                            v{v.versionNumber} - {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Verzija 2</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Izberi verzijo" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map(v => (
                          <SelectItem key={v.id} value={v.versionNumber.toString()}>
                            v{v.versionNumber} - {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setCompareDialogOpen(false)}>
                    Primerjaj
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Shrani Verzijo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ustvari Novo Verzijo</DialogTitle>
                  <DialogDescription>
                    Shrani trenutno stanje workflowa kot novo verzijo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="version-name">Ime</Label>
                    <Input
                      id="version-name"
                      value={newVersionData.name}
                      onChange={e =>
                        setNewVersionData({ ...newVersionData, name: e.target.value })
                      }
                      placeholder="npr. Dodan email notification"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="version-description">Opis</Label>
                    <Textarea
                      id="version-description"
                      value={newVersionData.description}
                      onChange={e =>
                        setNewVersionData({ ...newVersionData, description: e.target.value })
                      }
                      placeholder="Kratek opis sprememb"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="change-summary">Povzetek Sprememb</Label>
                    <Textarea
                      id="change-summary"
                      value={newVersionData.changeSummary}
                      onChange={e =>
                        setNewVersionData({ ...newVersionData, changeSummary: e.target.value })
                      }
                      placeholder="Kaj se je spremenilo?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tip Spremembe</Label>
                    <Select
                      value={newVersionData.changeType}
                      onValueChange={(value: 'major' | 'minor' | 'patch') =>
                        setNewVersionData({ ...newVersionData, changeType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="major">Major (velike spremembe)</SelectItem>
                        <SelectItem value="minor">Minor (manjše spremembe)</SelectItem>
                        <SelectItem value="patch">Patch (popravki)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Prekliči
                  </Button>
                  <Button onClick={handleCreateVersion}>
                    <GitCommit className="w-4 h-4 mr-2" />
                    Ustvari Verzijo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                version.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-2 h-2 rounded-full ${getChangeTypeColor(version.changeType)}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">v{version.versionNumber}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {version.name}
                    </span>
                    {version.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Trenutna
                      </Badge>
                    )}
                  </div>
                  {version.changeSummary && (
                    <p className="text-xs text-gray-500 mt-1">
                      <FileText className="w-3 h-3 inline mr-1" />
                      {version.changeSummary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.createdBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(version.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!version.isCurrent && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVersion(version.versionNumber);
                        setRollbackDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rollback
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Še ni shranjenih verzij</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potrdi Rollback</DialogTitle>
            <DialogDescription>
              Ali ste prepričani, da želite narediti rollback na verzijo v{selectedVersion}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
              Prekliči
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVersion && handleRollback(selectedVersion)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Potrdi Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
