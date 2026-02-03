import { Button, Form, Input, Alert, Row, Col } from "antd";
import { edenTreaty } from "../utils";
import {
  type Settings,
} from "../../modules/settings/model";
import { useActionState, useState, useEffect } from "react";

/**
 * Settings component using React 19's useActionState
 * Handles both initial setup and updates of application settings
 * Features responsive design using Ant Design Grid system
 */
function SettingsPage() {
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Load initial settings using useEffect
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await edenTreaty.settings.api.settings.get();
        
        if (response.error) {
          setError(`Failed to load settings: ${JSON.stringify(response.error)}`);
        } else {
          const settingsData = response.data;
          setInitialSettings(settingsData);
          setIsInitialSetup(settingsData === null);
        }
      } catch (err) {
        setError("An error has occurred: Can't communicate with server, maybe it's not even running yet.");
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Use useActionState for form submission and state management
  const [settings, formAction, isPending] = useActionState(
    async (prevState: Settings | null, formData: FormData) => {
      try {
        // Convert FormData to Settings object with proper field mapping
        const updatedSettings: Settings = {
          civitai_api_token: formData.get('civitai_api_token') as string,
          basePath: formData.get('basePath') as string,
          http_proxy: formData.get('http_proxy') as string || undefined,
          gopeed_api_host: formData.get('gopeed_api_host') as string,
          gopeed_api_token: formData.get('gopeed_api_token') as string || undefined
        };

        // Send update to server
        const response = await edenTreaty.settings.api.settings.post(updatedSettings);
        
        if (response.error) {
          console.error("Failed to save settings:", response.error);
          return prevState;
        }
        
        // After successful save, update the initial setup flag
        setIsInitialSetup(false);
        return response.data!;
      } catch (error) {
        console.error("Error saving settings:", error);
        return prevState;
      }
    },
    initialSettings
  );

  // Handle form submission errors
  const onFinishFailed = (errorInfo: any) => {
    console.log("Form validation failed:", errorInfo);
  };

  // Show loading state
  if (loading) {
    return "Loading...";
  }

  // Show error state
  if (error) {
    return <Alert 
      type="error" 
      message="Error" 
      description={error}
      showIcon
    />;
  }

  // Determine form values (use empty values for initial setup)
  const formValues = settings ? {
    civitai_api_token: settings.civitai_api_token,
    basePath: settings.basePath,
    http_proxy: settings.http_proxy || '',
    gopeed_api_host: settings.gopeed_api_host,
    gopeed_api_token: settings.gopeed_api_token || ''
  } : {
    civitai_api_token: '',
    basePath: '',
    http_proxy: '',
    gopeed_api_host: '',
    gopeed_api_token: ''
  };

  // Responsive form layout configuration
  const formItemLayout = {
    // Responsive label column configuration
    labelCol: {
      xs: { span: 24 },    // Mobile: full width
      sm: { span: 24 },    // Small tablet: full width  
      md: { span: 8 },     // Medium: 8/24
      lg: { span: 6 },     // Large: 6/24
      xl: { span: 6 },     // Extra large: 6/24
    },
    // Responsive wrapper column configuration
    wrapperCol: {
      xs: { span: 24 },    // Mobile: full width
      sm: { span: 24 },    // Small tablet: full width
      md: { span: 16 },    // Medium: 16/24
      lg: { span: 18 },    // Large: 18/24
      xl: { span: 18 },    // Extra large: 18/24
    },
  };

  // Responsive button layout
  const buttonLayout = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },    // Mobile: full width, no offset
      sm: { span: 24, offset: 0 },    // Small tablet: full width, no offset
      md: { span: 16, offset: 8 },    // Medium: offset to align with input fields
      lg: { span: 18, offset: 6 },    // Large: offset to align with input fields
      xl: { span: 18, offset: 6 },    // Extra large: offset to align with input fields
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      {isInitialSetup && (
        <Row justify="center">
          <Col 
            xs={24}      // Mobile: full width
            sm={24}      // Small tablet: full width
            md={20}      // Medium: 20/24
            lg={18}      // Large: 18/24
            xl={16}      // Extra large: 16/24
          >
            <Alert
              type="info"
              message="Initial Setup Required"
              description="This is your first time using the application. Please configure the required settings below to get started."
              showIcon
              style={{ marginBottom: 24 }}
            />
          </Col>
        </Row>
      )}
      
      <Row justify="center">
        <Col 
          xs={24}      // Mobile: full width
          sm={24}      // Small tablet: full width
          md={20}      // Medium: 20/24
          lg={18}      // Large: 18/24
          xl={16}      // Extra large: 16/24
        >
          <Form
            name="settings"
            initialValues={formValues}
            action={formAction}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            {...formItemLayout}
            layout="horizontal"
            colon={false}
          >
            <Form.Item
              label="CivitAI API Key"
              name="civitai_api_token"
              rules={[
                {
                  required: true,
                  message: "Please input your CivitAI API key here!",
                },
              ]}
              labelAlign="left"
            >
              <Input 
                placeholder="Enter your CivitAI API key" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Models saving location"
              name="basePath"
              rules={[
                {
                  required: true,
                  message: "Please input the location of where your models will be saved at.",
                },
              ]}
              labelAlign="left"
            >
              <Input 
                placeholder="Enter the path where models will be saved" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Proxy"
              name="http_proxy"
              rules={[
                {
                  required: false,
                  message: "You could set your proxy address for downloading at here. (optional)",
                },
              ]}
              labelAlign="left"
            >
              <Input 
                placeholder="Optional proxy address (e.g., http://proxy.example.com:8080)" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="GopeedAPI Host"
              name="gopeed_api_host"
              rules={[
                {
                  required: true,
                  message: "Please input your GopeedAPI host address here!",
                },
              ]}
              labelAlign="left"
            >
              <Input 
                placeholder="Enter GopeedAPI host address (e.g., http://localhost:9999)" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="GopeedAPI Token"
              name="gopeed_api_token"
              rules={[
                {
                  required: false,
                  message: "Optional GopeedAPI token",
                },
              ]}
              labelAlign="left"
            >
              <Input 
                placeholder="Optional GopeedAPI token" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item {...buttonLayout}>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isPending}
                disabled={isPending}
                size="large"
                style={{
                  marginTop: '16px'
                }}
              >
                {isInitialSetup ? "Complete Setup" : (isPending ? "Saving..." : "Save Settings")}
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default SettingsPage;
