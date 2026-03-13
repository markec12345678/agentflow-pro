/**
 * Property Hooks
 * 
 * React Query hooks for property data fetching and mutations.
 * Encapsulates all data fetching logic for clean components.
 */

'use client';

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import { propertyApi, ApiError } from './api/propertyApi';
import type { 
  Property, 
  PropertyCreateInput, 
  PropertyUpdateInput,
  PropertyFilters 
} from '@/entities/property/types';

/**
 * Query key factory for properties
 * Ensures consistent query keys across the app
 */
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const
};

/**
 * Get all properties with filters
 */
export function useProperties(
  filters?: PropertyFilters,
  options?: Omit<UseQueryOptions<Property[], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: propertyKeys.list(filters || {}),
    queryFn: () => propertyApi.getAll(filters).then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

/**
 * Get single property by ID
 */
export function useProperty(
  id: string,
  options?: Omit<UseQueryOptions<Property, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options
  });
}

/**
 * Create new property mutation
 */
export function useCreateProperty(
  options?: Omit<UseMutationOptions<Property, ApiError, PropertyCreateInput>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PropertyCreateInput) => propertyApi.create(data),
    onSuccess: (newProperty) => {
      // Invalidate property lists
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      
      // Show success notification (if you have a notification system)
      // toast.success('Property created successfully');
      
      options?.onSuccess?.(newProperty);
    },
    ...options
  });
}

/**
 * Update property mutation
 */
export function useUpdateProperty(
  options?: Omit<UseMutationOptions<Property, ApiError, { id: string; data: PropertyUpdateInput }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => propertyApi.update(id, data),
    onSuccess: (updatedProperty, variables) => {
      // Update the specific property in cache
      queryClient.setQueryData(
        propertyKeys.detail(variables.id),
        updatedProperty
      );
      
      // Invalidate lists to refresh filters
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      
      options?.onSuccess?.(updatedProperty, variables);
    },
    ...options
  });
}

/**
 * Delete property mutation
 */
export function useDeleteProperty(
  options?: Omit<UseMutationOptions<void, ApiError, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => propertyApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      
      options?.onSuccess?.(_, id);
    },
    ...options
  });
}

/**
 * Upload property images mutation
 */
export function useUploadImages(
  options?: Omit<UseMutationOptions<string[], ApiError, { id: string; files: File[] }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, files }) => propertyApi.uploadImages(id, files),
    onSuccess: (_, variables) => {
      // Invalidate the specific property to refresh images
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
      
      options?.onSuccess?.(_, variables);
    },
    ...options
  });
}

/**
 * Optimistic update hook
 * Updates UI immediately, rolls back on error
 */
export function useOptimisticPropertyUpdate() {
  const queryClient = useQueryClient();
  
  return useUpdateProperty({
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(id) });
      
      // Snapshot previous value
      const previousProperty = queryClient.getQueryData<Property>(
        propertyKeys.detail(id)
      );
      
      // Optimistically update
      if (previousProperty) {
        queryClient.setQueryData(
          propertyKeys.detail(id),
          { ...previousProperty, ...data }
        );
      }
      
      return { previousProperty };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProperty) {
        queryClient.setQueryData(
          propertyKeys.detail(variables.id),
          context.previousProperty
        );
      }
    }
  });
}
