"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, X, Clock, RotateCcw, Ban, Users, FileText, Edit, Save } from "lucide-react";

interface PropertyPolicy {
  id: string;
  policyType: string;
  content: string;
  createdAt: string;
}

const POLICY_TEMPLATES = {
  "check-in-out": {
    title: "Check-in/Check-out Times",
    icon: <Clock className="w-5 h-5" />,
    templates: [
      {
        name: "Hotel Standard",
        content: "Check-in: 15:00 (3:00 PM)\nCheck-out: 11:00 (11:00 AM)\n\nEarly check-in subject to availability. Late check-out available upon request for additional fee."
      },
      {
        name: "Apartment Flexible",
        content: "Check-in: 14:00 (2:00 PM)\nCheck-out: 10:00 (10:00 AM)\n\nSelf-check-in available. Flexible timing possible with advance notice."
      },
      {
        name: "Resort Luxury",
        content: "Check-in: 16:00 (4:00 PM)\nCheck-out: 12:00 (12:00 PM)\n\nWelcome drink upon arrival. Luggage storage available."
      }
    ]
  },
  "cancellation": {
    title: "Cancellation Policy",
    icon: <RotateCcw className="w-5 h-5" />,
    templates: [
      {
        name: "Flexible 24h",
        content: "Free cancellation up to 24 hours before check-in. Cancellation within 24 hours will result in charge of first night's stay."
      },
      {
        name: "Standard 48h",
        content: "Free cancellation up to 48 hours before check-in. Cancellation within 48 hours will result in charge of 50% of total stay."
      },
      {
        name: "Strict 7 days",
        content: "Free cancellation up to 7 days before check-in. Cancellation within 7 days will result in charge of 100% of total stay."
      }
    ]
  },
  "pets": {
    title: "Pet Policy",
    icon: <Users className="w-5 h-5" />,
    templates: [
      {
        name: "Pets Not Allowed",
        content: "Pets are not allowed on the property premises. Service animals are welcome with proper documentation."
      },
      {
        name: "Pets Allowed (Fee)",
        content: "Pets are welcome with additional fee of €20 per pet per night. Maximum 2 pets per room. Pet deposit of €100 required."
      },
      {
        name: "Pet Friendly",
        content: "Pets are welcome at no additional charge. Pet-friendly amenities available. Please inform about pet type and size in advance."
      }
    ]
  },
  "smoking": {
    title: "Smoking Policy",
    icon: <Ban className="w-5 h-5" />,
    templates: [
      {
        name: "Non-Smoking",
        content: "All rooms and indoor areas are non-smoking. Smoking is only permitted in designated outdoor areas. Violation will result in additional cleaning fee of €200."
      },
      {
        name: "Designated Areas",
        content: "Non-smoking rooms available. Designated smoking areas provided on balcony or terrace. Please request smoking room at time of booking."
      }
    ]
  },
  "payment": {
    title: "Payment Policy",
    icon: <FileText className="w-5 h-5" />,
    templates: [
      {
        name: "Standard",
        content: "30% deposit required at booking. Full payment due 7 days before arrival. Credit card, bank transfer, and cash accepted."
      },
      {
        name: "Flexible",
        content: "Full payment at check-in. All major credit cards, PayPal, and cash accepted. No deposit required."
      }
    ]
  }
};

export default function PoliciesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [policies, setPolicies] = useState<PropertyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [newPolicyForm, setNewPolicyForm] = useState({ policyType: "", content: "" });
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    if (propertyId) {
      fetchPolicies();
    }
  }, [propertyId]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/policies`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const addPolicy = async (policyType: string, content: string) => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType, content }),
      });

      if (response.ok) {
        toast.success("Policy added successfully");
        fetchPolicies();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add policy");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const updatePolicy = async (policyId: string, content: string) => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        toast.success("Policy updated successfully");
        setEditingPolicy(null);
        fetchPolicies();
      } else {
        toast.error("Failed to update policy");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const removePolicy = async (policyId: string) => {
    try {
      const response = await fetch(`/api/tourism/properties/${propertyId}/policies/${policyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Policy removed successfully");
        fetchPolicies();
      } else {
        toast.error("Failed to remove policy");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getPolicyForType = (type: string) => {
    return policies.find(p => p.policyType === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {Object.keys(POLICY_TEMPLATES).map((key) => (
                <div key={key} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Property Policies</h1>
          <p className="text-gray-600 mt-2">Set up your property rules and policies</p>
        </div>

        {/* Policy Categories */}
        <div className="space-y-6">
          {Object.entries(POLICY_TEMPLATES).map(([policyType, category]) => {
            const existingPolicy = getPolicyForType(policyType);
            const isEditing = editingPolicy === existingPolicy?.id;

            return (
              <div key={policyType} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">
                      {existingPolicy ? "Policy configured" : "Not configured yet"}
                    </p>
                  </div>
                  {existingPolicy && !isEditing && (
                    <button
                      onClick={() => setEditingPolicy(existingPolicy.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 mr-2"
                      title="Edit policy"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {existingPolicy && (
                  <div className="mb-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={existingPolicy.content}
                          onChange={(e) => {
                            setEditingPolicy({ ...existingPolicy, content: e.target.value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={6}
                          placeholder="Enter policy content"
                          title="Policy content"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updatePolicy(existingPolicy.id, existingPolicy.content)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Save policy"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPolicy(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Cancel editing"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => removePolicy(existingPolicy.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Delete policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{existingPolicy.content}</p>
                      </div>
                    )}
                  </div>
                )}

                {!existingPolicy && (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-3">Choose a template or create custom policy:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.templates.map((template) => (
                          <button
                            key={template.name}
                            onClick={() => addPolicy(policyType, template.content)}
                            className="text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{template.name}</div>
                            <div className="text-sm text-gray-600 truncate">{template.content.substring(0, 60)}...</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <button
                        onClick={() => setAddingNew(policyType)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Custom Policy
                      </button>
                    </div>

                    {addingNew === policyType && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={newPolicyForm.content}
                          onChange={(e) => setNewPolicyForm({ ...newPolicyForm, content: e.target.value })}
                          placeholder="Enter your custom policy..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          title="Custom policy content"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              addPolicy(policyType, newPolicyForm.content);
                              setNewPolicyForm({ policyType: "", content: "" });
                              setAddingNew(false);
                            }}
                            disabled={!newPolicyForm.content.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Add Policy
                          </button>
                          <button
                            onClick={() => {
                              setAddingNew(false);
                              setNewPolicyForm({ policyType: "", content: "" });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Policy Type */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Policy Type</h3>
          <p className="text-sm text-gray-600 mb-4">Create a policy type that's not covered by standard categories</p>
          
          <div className="space-y-3">
            <input
              type="text"
              value={newPolicyForm.policyType}
              onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyType: e.target.value })}
              placeholder="Policy type (e.g., house-rules, local-taxes)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={newPolicyForm.content}
              onChange={(e) => setNewPolicyForm({ ...newPolicyForm, content: e.target.value })}
              placeholder="Policy content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              title="Policy content"
            >
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newPolicyForm.policyType.trim() && newPolicyForm.content.trim()) {
                  addPolicy(newPolicyForm.policyType, newPolicyForm.content);
                  setNewPolicyForm({ policyType: "", content: "" });
                }
              }}
              disabled={!newPolicyForm.policyType.trim() || !newPolicyForm.content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Custom Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
