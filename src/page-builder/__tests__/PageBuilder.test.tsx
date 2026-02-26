import { render, screen, fireEvent } from '@testing-library/react';
import { TextPlugin } from '../plugins/TextPlugin';
import { ImagePlugin } from '../plugins/ImagePlugin';
import { ButtonPlugin } from '../plugins/ButtonPlugin';
import { FormPlugin } from '../plugins/FormPlugin';

// Mock WebSocket for testing
const mockWebSocket = {
  send: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
};

// Mock PluginContext
const mockPluginContext = {
  plugins: [],
  registerPlugin: jest.fn(),
  unregisterPlugin: jest.fn(),
  getPlugin: jest.fn(),
  getAllPlugins: jest.fn(() => [
    { id: "text", name: "Text Component", component: TextPlugin.component },
    { id: "image", name: "Image Component", component: ImagePlugin.component },
    { id: "button", name: "Button Component", component: ButtonPlugin.component },
    { id: "form", name: "Form Component", component: FormPlugin.component },
  ]),
};

describe('PageBuilder', () => {
  beforeEach(() => {
    jest.mock('../context/PluginContext', () => mockPluginContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders plugin library correctly', () => {
    render(<div><TextPlugin config={{}} /></div>);
    
    expect(mockPluginContext.getAllPlugins).toHaveBeenCalled();
    expect(screen.getByText('Text Component')).toBeInTheDocument();
    expect(screen.getByText('Image Component')).toBeInTheDocument();
    expect(screen.getByText('Button Component')).toBeInTheDocument();
    expect(screen.getByText('Form Component')).toBeInTheDocument();
  });

  test('can select and configure plugins', () => {
    const { getAllPlugins } = mockPluginContext;
    const plugins = getAllPlugins();
    
    // Test text plugin selection
    fireEvent.click(screen.getByText('Text Component'));
    expect(mockPluginContext.getPlugin).toHaveBeenCalledWith('text');
    
    // Test image plugin selection
    fireEvent.click(screen.getByText('Image Component'));
    expect(mockPluginContext.getPlugin).toHaveBeenCalledWith('image');
    
    // Test button plugin selection
    fireEvent.click(screen.getByText('Button Component'));
    expect(mockPluginContext.getPlugin).toHaveBeenCalledWith('button');
    
    // Test form plugin selection
    fireEvent.click(screen.getByText('Form Component'));
    expect(mockPluginContext.getPlugin).toHaveBeenCalledWith('form');
  });

  test('plugin configuration works', () => {
    const onUpdate = jest.fn();
    
    render(
      <div>
        <TextPlugin config={{}} onUpdate={onUpdate} />
        <ButtonPlugin config={{}} onUpdate={onUpdate} />
        <FormPlugin config={{}} onUpdate={onUpdate} />
      </div>
    );

    fireEvent.click(screen.getByText('Text Component'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.any(String),
    }));

    fireEvent.click(screen.getByText('Button Component'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      variant: expect.any(String),
      size: expect.any(String),
    }));

    fireEvent.click(screen.getByText('Form Component'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      fields: expect.any(Array),
    }));
  });

  expect(onUpdate).toHaveBeenCalledTimes(3);
  expect(mockPluginContext.getPlugin).toHaveBeenCalledTimes(3);
  expect(mockPluginContext.getPlugin).toHaveBeenCalledTimes(3);
  expect(mockPluginContext.getPlugin).toHaveBeenCalledTimes(3);
  expect(mockPluginContext.getPlugin).toHaveBeenCalledTimes(3);
  });

  test('drag and drop functionality', () => {
    // This would require more complex setup with actual DnD
    // For now, we'll test the component rendering
    expect(screen.getByText('Page Builder')).toBeInTheDocument();
  });
});
