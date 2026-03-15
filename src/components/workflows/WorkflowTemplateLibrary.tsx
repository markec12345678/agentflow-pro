'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Input } from '@/web/components/ui/input';
import {
  Search,
  Zap,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Settings,
  TrendingUp,
  Clock,
  Star,
  Copy,
  Eye,
  Play,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/web/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/web/components/ui/tabs';
import { PropertySelector } from '@/web/components/PropertySelector';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeSaved: string;
  trigger: {
    type: 'scheduled' | 'event' | 'webhook';
    schedule?: string;
    event?: string;
    condition?: string;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
}

interface WorkflowTemplateLibraryProps {
  onUseTemplate?: (workflow: any) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Vsi', icon: Zap },
  { id: 'guest-communication', label: 'Gostne Komunikacije', icon: Mail },
  { id: 'operations', label: 'Operacije', icon: Settings },
  { id: 'revenue', label: 'Prihodki', icon: DollarSign },
];

export default function WorkflowTemplateLibrary({
  onUseTemplate,
}: WorkflowTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  // Fetch templates from API on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflows/from-template');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      logger.error('Error fetching templates:', error);
      toast.error('Napaka pri nalaganju template-ov');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    if (!activePropertyId) {
      toast.error('Izberite nastanitev za kreiranje workflow-a');
      return;
    }

    setCreatingWorkflow(true);
    try {
      const res = await fetch('/api/workflows/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          propertyId: activePropertyId,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Workflow "${template.name}" ustvarjen`);
      onUseTemplate?.(data.workflow);
      setPreviewOpen(false);

      // Redirect to workflow editor
      window.location.href = `/dashboard/workflows/${data.workflow.id}/edit`;
    } catch (error) {
      logger.error('Error creating workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Napaka pri ustvarjanju workflow-a');
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      send_email: 'Pošlji email',
      send_sms: 'Pošlji SMS',
      send_whatsapp: 'Pošlji WhatsApp',
      send_notification: 'Pošlji obvestilo',
      create_task: 'Ustvari nalogo',
      update_reservation: 'Posodobi rezervacijo',
      update_room_status: 'Posodobi status sobe',
      sync_eturizem: 'Sinhroniziraj eTurizem',
      analyze_demand: 'Analiziraj povpraševanje',
      check_competitor_prices: 'Preveri cene konkurence',
      adjust_prices: 'Prilagodi cene',
      sync_channels: 'Sinhroniziraj kanale',
      log_activity: 'Zabeleži aktivnost',
      update_guest_profile: 'Posodobi profil gosta',
      create_workflow: 'Ustvari workflow',
    };
    return labels[actionType] || actionType;
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      send_email: '📧',
      send_sms: '📱',
      send_whatsapp: '💬',
      send_notification: '🔔',
      create_task: '✅',
      update_reservation: '📅',
      update_room_status: '🧹',
      sync_eturizem: '🔄',
      analyze_demand: '📊',
      check_competitor_prices: '🔍',
      adjust_prices: '💰',
      sync_channels: '🌐',
      log_activity: '📝',
      update_guest_profile: '👤',
      create_workflow: '🔄',
    };
    return icons[actionType] || '⚙️';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workflow Template Knjižnica
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Izberite prednastavljen template in ga prilagodite
          </p>
        </div>
        <div className="w-full md:w-auto">
          <PropertySelector
            value={activePropertyId}
            onChange={setActivePropertyId}
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Išči template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex flex-wrap h-auto gap-2">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <cat.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Nalaganje template-ov...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTemplate(template);
                  setPreviewOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-4xl mb-2">
                      {getActionIcon(template.actions[0]?.type || 'send_email')}
                    </div>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty === 'easy' && 'Lahek'}
                      {template.difficulty === 'medium' && 'Srednji'}
                      {template.difficulty === 'hard' && 'Napreden'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.estimatedTimeSaved}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {template.actions.length} akcij
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                      disabled={creatingWorkflow || !activePropertyId}
                    >
                      {creatingWorkflow ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Uporabi
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-gray-600 dark:text-gray-400">
              Ni templateov za izbrane filtre
            </p>
          </div>
        )}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        {selectedTemplate && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">
                  {getActionIcon(selectedTemplate.actions[0]?.type || 'send_email')}
                </span>
                {selectedTemplate.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-semibold">{selectedTemplate.estimatedTimeSaved}</p>
                  <p className="text-xs text-gray-500">Prihranjen čas</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Zap className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-semibold">{selectedTemplate.actions.length}</p>
                  <p className="text-xs text-gray-500">Akcij</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Settings className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold capitalize">{selectedTemplate.difficulty}</p>
                  <p className="text-xs text-gray-500">Težavnost</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Trigger:</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {selectedTemplate.trigger.type === 'scheduled' && '⏰'}
                      {selectedTemplate.trigger.type === 'event' && '📢'}
                      {selectedTemplate.trigger.type === 'webhook' && '🔗'}
                    </span>
                    <div>
                      <p className="font-medium">
                        {selectedTemplate.trigger.type === 'scheduled' && `Vsak: ${selectedTemplate.trigger.schedule}`}
                        {selectedTemplate.trigger.type === 'event' && `Dogodek: ${selectedTemplate.trigger.event}`}
                        {selectedTemplate.trigger.type === 'webhook' && 'Webhook klic'}
                      </p>
                      {selectedTemplate.trigger.condition && (
                        <p className="text-xs text-gray-500 mt-1">
                          Pogoj: {selectedTemplate.trigger.condition}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Akcije ({selectedTemplate.actions.length}):</h4>
                <div className="space-y-2">
                  {selectedTemplate.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-xl">{getActionIcon(action.type)}</span>
                      <div className="flex-1">
                        <p className="font-medium">{getActionLabel(action.type)}</p>
                        {Object.keys(action.config).length > 0 && (
                          <p className="text-xs text-gray-500">
                            {Object.keys(action.config).slice(0, 3).join(', ')}
                            {Object.keys(action.config).length > 3 && '...'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Prekliči
              </Button>
              <Button
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={creatingWorkflow || !activePropertyId}
              >
                {creatingWorkflow ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ustvarjam...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Uporabi Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
