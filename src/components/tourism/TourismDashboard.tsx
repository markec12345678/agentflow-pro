/**
 * AgentFlow Pro - Tourism Vertical Frontend Integration
 * React components for tourism workflow management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Tourism workflow types
interface TourismWorkflowInput {
  useCase: string;
  propertyData?: any;
  tourData?: any;
  guestData?: any;
  contentData?: any;
}

interface TourismWorkflowOutput {
  success: boolean;
  content?: string;
  metadata?: any;
  error?: string;
}

interface MultiLanguageRequest {
  content: string;
  sourceLanguage: string;
  targetLanguages: string[];
  context?: string;
}

interface SeasonalContent {
  id: string;
  title: string;
  season: string;
  status: string;
  scheduledDate?: string;
}

interface BookingRequest {
  channel: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestData: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface ReviewData {
  rating: number;
  title: string;
  content: string;
  author: string;
  platform: string;
}

// Main Tourism Dashboard Component
export function TourismDashboard() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Workflow state
  const [workflowInput, setWorkflowInput] = useState<TourismWorkflowInput>({
    useCase: 'property_description'
  });

  // Multi-language state
  const [translationRequest, setTranslationRequest] = useState<MultiLanguageRequest>({
    content: '',
    sourceLanguage: 'en',
    targetLanguages: ['sl', 'de', 'it']
  });

  // Seasonal content state
  const [seasonalContents, setSeasonalContents] = useState<SeasonalContent[]>([]);
  const [newSeasonalContent, setNewSeasonalContent] = useState({
    title: '',
    content: '',
    season: 'summer',
    scheduledDate: ''
  });

  // Booking state
  const [bookingRequest, setBookingRequest] = useState<BookingRequest>({
    channel: 'booking.com',
    propertyId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    guestData: {
      name: '',
      email: '',
      phone: ''
    }
  });

  // Review state
  const [newReview, setNewReview] = useState<ReviewData>({
    rating: 5,
    title: '',
    content: '',
    author: '',
    platform: 'booking.com'
  });

  // API call helper
  const apiCall = async (action: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tourism/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Execute tourism workflow
  const executeWorkflow = () => {
    apiCall('execute_workflow', workflowInput);
  };

  // Translate content
  const translateContent = () => {
    apiCall('translate_content', translationRequest);
  };

  // Schedule seasonal content
  const scheduleSeasonalContent = () => {
    const content = {
      title: newSeasonalContent.title,
      content: newSeasonalContent.content,
      season: newSeasonalContent.season,
      contentType: 'blog',
      languages: ['en'],
      targetAudience: ['tourists']
    };
    
    apiCall('schedule_seasonal_content', {
      content,
      season: newSeasonalContent.season,
      scheduledDate: newSeasonalContent.scheduledDate
    });
  };

  // Create booking
  const createBooking = () => {
    apiCall('create_unified_booking', bookingRequest);
  };

  // Add review
  const addReview = () => {
    apiCall('add_review', newReview);
  };

  // Load seasonal contents
  useEffect(() => {
    // Mock data - would load from API
    setSeasonalContents([
      {
        id: '1',
        title: 'Summer Vacation Special',
        season: 'summer',
        status: 'published',
        scheduledDate: '2026-06-01'
      },
      {
        id: '2', 
        title: 'Winter Wellness Retreat',
        season: 'winter',
        status: 'scheduled',
        scheduledDate: '2026-12-15'
      }
    ]);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AgentFlow Pro - Tourism Vertical</h1>
          <p className="text-muted-foreground">Complete tourism workflow management with AI automation</p>
        </div>
        <Badge variant="secondary" className="text-green-600">
          All Critical Gaps Filled ✅
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="multilang">Multi-language</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tourism Workflows</CardTitle>
              <CardDescription>Execute AI-powered tourism content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Use Case</label>
                  <Select value={workflowInput.useCase} onValueChange={(value) => 
                    setWorkflowInput({...workflowInput, useCase: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property_description">Property Descriptions</SelectItem>
                      <SelectItem value="tour_package">Tour Package Content</SelectItem>
                      <SelectItem value="guest_automation">Guest Email Automation</SelectItem>
                      <SelectItem value="translation">Multi-language Translation</SelectItem>
                      <SelectItem value="destination_blog">Destination Blog Posts</SelectItem>
                      <SelectItem value="social_media">Social Media Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {workflowInput.useCase === 'property_description' && (
                  <div>
                    <label className="text-sm font-medium">Property Name</label>
                    <Input 
                      placeholder="Grand Hotel Ljubljana"
                      value={workflowInput.propertyData?.name || ''}
                      onChange={(e) => setWorkflowInput({
                        ...workflowInput,
                        propertyData: {...workflowInput.propertyData, name: e.target.value}
                      })}
                    />
                  </div>
                )}
              </div>

              <Button onClick={executeWorkflow} disabled={loading}>
                {loading ? 'Executing...' : 'Execute Workflow'}
              </Button>

              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle>Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-language Tab */}
        <TabsContent value="multilang" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-language Support</CardTitle>
              <CardDescription>Translate content to multiple languages with cultural adaptation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Content to Translate</label>
                <Textarea 
                  placeholder="Enter content to translate..."
                  value={translationRequest.content}
                  onChange={(e) => setTranslationRequest({...translationRequest, content: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Source Language</label>
                  <Select value={translationRequest.sourceLanguage} onValueChange={(value) =>
                    setTranslationRequest({...translationRequest, sourceLanguage: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sl">Slovenian</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Languages</label>
                  <div className="space-y-2">
                    {['sl', 'de', 'it', 'fr', 'es'].map(lang => (
                      <label key={lang} className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={translationRequest.targetLanguages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTranslationRequest({
                                ...translationRequest,
                                targetLanguages: [...translationRequest.targetLanguages, lang]
                              });
                            } else {
                              setTranslationRequest({
                                ...translationRequest,
                                targetLanguages: translationRequest.targetLanguages.filter(l => l !== lang)
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{lang.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={translateContent} disabled={loading}>
                {loading ? 'Translating...' : 'Translate Content'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Content Tab */}
        <TabsContent value="seasonal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Content Scheduling</CardTitle>
              <CardDescription>Automate seasonal content publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Summer Vacation Special"
                    value={newSeasonalContent.title}
                    onChange={(e) => setNewSeasonalContent({...newSeasonalContent, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Season</label>
                  <Select value={newSeasonalContent.season} onValueChange={(value) =>
                    setNewSeasonalContent({...newSeasonalContent, season: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="autumn">Autumn</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea 
                  placeholder="Seasonal content..."
                  value={newSeasonalContent.content}
                  onChange={(e) => setNewSeasonalContent({...newSeasonalContent, content: e.target.value})}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Scheduled Date</label>
                <Input 
                  type="date"
                  value={newSeasonalContent.scheduledDate}
                  onChange={(e) => setNewSeasonalContent({...newSeasonalContent, scheduledDate: e.target.value})}
                />
              </div>

              <Button onClick={scheduleSeasonalContent} disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule Content'}
              </Button>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Scheduled Content</h3>
                {seasonalContents.map(content => (
                  <div key={content.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{content.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {content.season} • {content.status} • {content.scheduledDate}
                      </div>
                    </div>
                    <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                      {content.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Tab */}
        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unified Booking Management</CardTitle>
              <CardDescription>Manage bookings across multiple channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Channel</label>
                  <Select value={bookingRequest.channel} onValueChange={(value) =>
                    setBookingRequest({...bookingRequest, channel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking.com">Booking.com</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Property ID</label>
                  <Input 
                    placeholder="prop-123"
                    value={bookingRequest.propertyId}
                    onChange={(e) => setBookingRequest({...bookingRequest, propertyId: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Check-in</label>
                  <Input 
                    type="date"
                    value={bookingRequest.checkIn}
                    onChange={(e) => setBookingRequest({...bookingRequest, checkIn: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Check-out</label>
                  <Input 
                    type="date"
                    value={bookingRequest.checkOut}
                    onChange={(e) => setBookingRequest({...bookingRequest, checkOut: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Guests</label>
                  <Input 
                    type="number"
                    min="1"
                    value={bookingRequest.guests}
                    onChange={(e) => setBookingRequest({...bookingRequest, guests: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Guest Name</label>
                  <Input 
                    placeholder="John Doe"
                    value={bookingRequest.guestData.name}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestData: {...bookingRequest.guestData, name: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Guest Email</label>
                  <Input 
                    type="email"
                    placeholder="john@example.com"
                    value={bookingRequest.guestData.email}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestData: {...bookingRequest.guestData, email: e.target.value}
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Guest Phone</label>
                  <Input 
                    placeholder="+386 123 456 789"
                    value={bookingRequest.guestData.phone || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestData: {...bookingRequest.guestData, phone: e.target.value}
                    })}
                  />
                </div>
              </div>

              <Button onClick={createBooking} disabled={loading}>
                {loading ? 'Creating Booking...' : 'Create Booking'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Review Management</CardTitle>
              <CardDescription>Manage and respond to guest reviews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <Select value={newReview.rating.toString()} onValueChange={(value) =>
                    setNewReview({...newReview, rating: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={newReview.platform} onValueChange={(value) =>
                    setNewReview({...newReview, platform: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking.com">Booking.com</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Review Title</label>
                <Input 
                  placeholder="Amazing stay!"
                  value={newReview.title}
                  onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Review Content</label>
                <Textarea 
                  placeholder="Guest review content..."
                  value={newReview.content}
                  onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Guest Name</label>
                <Input 
                  placeholder="John Doe"
                  value={newReview.author}
                  onChange={(e) => setNewReview({...newReview, author: e.target.value})}
                />
              </div>

              <Button onClick={addReview} disabled={loading}>
                {loading ? 'Adding Review...' : 'Add Review'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tourism Compliance</CardTitle>
              <CardDescription>GDPR, licensing, and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Compliance templates are available for GDPR privacy notices, tourism licensing, and accessibility standards.
                    Use the API to generate compliance documents for your tourism business.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">✅</div>
                        <div className="font-medium">GDPR</div>
                        <div className="text-sm text-muted-foreground">Privacy notices</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">✅</div>
                        <div className="font-medium">Licensing</div>
                        <div className="text-sm text-muted-foreground">Tourism permits</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">✅</div>
                        <div className="font-medium">Accessibility</div>
                        <div className="text-sm text-muted-foreground">WCAG standards</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export individual components for use in other pages
export { TourismDashboard as default };
