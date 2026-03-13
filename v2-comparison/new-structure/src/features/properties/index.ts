/**
 * Properties Feature - Public API
 */

// Components
export { PropertyList } from './components/PropertyList';
export { PropertyCard } from './components/PropertyCard';

// Hooks
export {
  useProperties,
  useProperty,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useUploadImages,
  useOptimisticPropertyUpdate,
  propertyKeys
} from './hooks/useProperties';

// API
export { propertyApi, ApiError } from './api/propertyApi';

// Actions
export {
  createPropertyAction,
  updatePropertyAction,
  deletePropertyAction,
  createProperty,
  updateProperty
} from './actions';
