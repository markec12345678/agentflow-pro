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

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  rating: number;
  uses: number;
  nodes: any[];
  edges: any[];
  triggers: string[];
  actions: string[];
}

interface WorkflowTemplateLibraryProps {
  onUseTemplate?: (template: WorkflowTemplate) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Vsi', icon: Zap },
  { id: 'guest-communication', label: 'Gostne Komunikacije', icon: Mail },
  { id: 'booking', label: 'Rezervacije', icon: Calendar },
  { id: 'revenue', label: 'Prihodki', icon: DollarSign },
  { id: 'reviews', label: 'Mnenja', icon: Star },
  { id: 'housekeeping', label: 'Hišništvo', icon: Settings },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'auto-checkin-reminder',
    name: 'Avtomatski Check-in Opomnik',
    description: 'Pošlji opomnik 1 dan pred check-in z navodili za prihod',
    category: 'guest-communication',
    icon: '📧',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    rating: 4.8,
    uses: 1247,
    triggers: ['1 day before check-in'],
    actions: ['Send email', 'Send SMS'],
    nodes: [],
    edges: [],
  },
  {
    id: 'review-request',
    name: 'Prošnja za Mnenje',
    description: 'Avtomatska prošnja za Google/TripAdvisor mnenje po check-outu',
    category: 'reviews',
    icon: '⭐',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    rating: 4.9,
    uses: 2156,
    triggers: ['1 day after check-out'],
    actions: ['Send email', 'Track response'],
    nodes: [],
    edges: [],
  },
  {
    id: 'booking-confirmation',
    name: 'Potrdilo Rezervacije',
    description: 'Takojšnje potrdilo z vsemi podrobnostmi rezervacije',
    category: 'booking',
    icon: '✅',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    rating: 4.7,
    uses: 3421,
    triggers: ['New booking'],
    actions: ['Send email', 'Update calendar', 'Send to PMS'],
    nodes: [],
    edges: [],
  },
  {
    id: 'dynamic-pricing-update',
    name: 'Dinamična Posodobitev Cen',
    description: 'Samodejna prilagoditev cen glede na zasedenost in povpraševanje',
    category: 'revenue',
    icon: '💰',
    difficulty: 'advanced',
    estimatedTime: '20 min',
    rating: 4.6,
    uses: 892,
    triggers: ['Daily at 9 AM', 'Occupancy > 80%'],
    actions: ['Analyze occupancy', 'Update prices', 'Notify owner'],
    nodes: [],
    edges: [],
  },
  {
    id: 'vip-guest-treatment',
    name: 'VIP Gost Obravnava',
    description: 'Posebna obravnava za ponavljajoče se goste',
    category: 'guest-communication',
    icon: '👑',
    difficulty: 'intermediate',
    estimatedTime: '15 min',
    rating: 4.9,
    uses: 567,
    triggers: ['Repeat guest booking', 'VIP tag'],
    actions: ['Send welcome gift', 'Upgrade room', 'Personal message'],
    nodes: [],
    edges: [],
  },
  {
    id: 'housekeeping-assignment',
    name: 'Dodelitev Hišništva',
    description: 'Avtomatska dodelitev nalog hišništvu po check-outu',
    category: 'housekeeping',
    icon: '🧹',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    rating: 4.5,
    uses: 1834,
    triggers: ['Check-out completed'],
    actions: ['Create task', 'Assign to staff', 'Send notification'],
    nodes: [],
    edges: [],
  },
  {
    id: 'abandoned-booking-recovery',
    name: 'Obnova Opuščene Rezervacije',
    description: 'Sledenje gostom, ki niso zaključili rezervacije',
    category: 'marketing',
    icon: '🎯',
    difficulty: 'advanced',
    estimatedTime: '20 min',
    rating: 4.7,
    uses: 423,
    triggers: ['Booking started but not completed'],
    actions: ['Wait 1 hour', 'Send reminder email', 'Offer discount'],
    nodes: [],
    edges: [],
  },
  {
    id: 'birthday-automation',
    name: 'Rojstnodnevna Avtomatizacija',
    description: 'Čestitka in posebna ponudba za rojstni dan gosta',
    category: 'guest-communication',
    icon: '🎂',
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    rating: 4.8,
    uses: 756,
    triggers: ['Guest birthday'],
    actions: ['Send birthday email', 'Offer discount', 'Add gift to room'],
    nodes: [],
    edges: [],
  },
];

export default function WorkflowTemplateLibrary({
  onUseTemplate,
}: WorkflowTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: WorkflowTemplate) => {
    onUseTemplate?.(template);
    toast.success(`Template "${template.name}" naložen`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Workflow Template Knjižnica
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Izberite prednastavljen template in ga prilagodite
        </p>
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
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty === 'beginner' && 'Začetnik'}
                    {template.difficulty === 'intermediate' && 'Srednje'}
                    {template.difficulty === 'advanced' && 'Napredno'}
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
                    {template.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {template.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.uses}
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
                  >
                    <Copy className="w-4 h-4 mr-2" />
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
                <span className="text-3xl">{selectedTemplate.icon}</span>
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
                  <p className="text-sm font-semibold">{selectedTemplate.estimatedTime}</p>
                  <p className="text-xs text-gray-500">Čas namestitve</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Star className="w-5 h-5 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm font-semibold">{selectedTemplate.rating}</p>
                  <p className="text-xs text-gray-500">Ocena</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-semibold">{selectedTemplate.uses}</p>
                  <p className="text-xs text-gray-500">Uporab</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Triggerji:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.triggers.map((trigger, i) => (
                    <Badge key={i} variant="secondary">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Akcije:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.actions.map((action, i) => (
                    <Badge key={i} variant="outline">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Prekliči
              </Button>
              <Button
                onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  setPreviewOpen(false);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Uporabi Template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
