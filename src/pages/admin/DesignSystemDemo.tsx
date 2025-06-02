
import React, { useState } from 'react';
import { Info, User, Settings, Mail, Calendar, Star } from 'lucide-react';
import {
  Card,
  PrimaryCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  PrimaryAction,
  OutlineAction,
  GhostAction,
  PageTitle,
  SectionTitle,
  PageDescription,
  SuccessBadge,
  WarningBadge,
  InfoBadge,
  ErrorBadge,
  NeutralBadge,
  PriorityBadge,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Modal,
  ActionModal,
  InfoBox
} from '@/components/ui/design-system';

const DesignSystemDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const sampleData = [
    { id: 1, name: 'John Doe', role: 'Developer', status: 'Active' },
    { id: 2, name: 'Jane Smith', role: 'Designer', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', role: 'Manager', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <PageTitle>Design System Showcase</PageTitle>
          <PageDescription>
            A comprehensive showcase of all design system components available in the application.
            Use this page as a reference for consistent UI implementation.
          </PageDescription>
        </div>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Text styles and hierarchies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Page Title</h4>
                <PageTitle>This is a Page Title</PageTitle>
                <code className="text-xs text-gray-500 mt-1 block">
                  {'<PageTitle>This is a Page Title</PageTitle>'}
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Section Title</h4>
                <SectionTitle>This is a Section Title</SectionTitle>
                <code className="text-xs text-gray-500 mt-1 block">
                  {'<SectionTitle>This is a Section Title</SectionTitle>'}
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Page Description</h4>
                <PageDescription>
                  This is a page description that provides additional context and information.
                </PageDescription>
                <code className="text-xs text-gray-500 mt-1 block">
                  {'<PageDescription>This is a page description...</PageDescription>'}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>All button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Button Variants */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Variants</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                </div>
                <code className="text-xs text-gray-500 mt-2 block">
                  {'<Button variant="primary">Primary</Button>'}
                </code>
              </div>

              {/* Button Sizes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Sizes</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Settings /></Button>
                </div>
                <code className="text-xs text-gray-500 mt-2 block">
                  {'<Button size="sm">Small</Button>'}
                </code>
              </div>

              {/* Action Button Variants */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Action Variants</h4>
                <div className="flex flex-wrap gap-4">
                  <PrimaryAction>Primary Action</PrimaryAction>
                  <OutlineAction>Outline Action</OutlineAction>
                  <GhostAction>Ghost Action</GhostAction>
                </div>
                <code className="text-xs text-gray-500 mt-2 block">
                  {'<PrimaryAction>Primary Action</PrimaryAction>'}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Card components with different configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>A simple card with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">This is the card content area.</p>
                </CardContent>
              </Card>

              {/* Primary Card */}
              <PrimaryCard>
                <CardHeader>
                  <CardTitle>Primary Card</CardTitle>
                  <CardDescription>A primary variant card</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">This is a primary card variant.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </PrimaryCard>
            </div>
            <code className="text-xs text-gray-500 mt-4 block">
              {'<Card><CardHeader><CardTitle>Basic Card</CardTitle></CardHeader></Card>'}
            </code>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>Various status indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <SuccessBadge>Success</SuccessBadge>
              <WarningBadge>Warning</WarningBadge>
              <InfoBadge>Info</InfoBadge>
              <ErrorBadge>Error</ErrorBadge>
              <NeutralBadge>Neutral</NeutralBadge>
              <PriorityBadge>Priority</PriorityBadge>
            </div>
            <code className="text-xs text-gray-500 mt-4 block">
              {'<SuccessBadge>Success</SuccessBadge>'}
            </code>
          </CardContent>
        </Card>

        {/* Info Box Section */}
        <Card>
          <CardHeader>
            <CardTitle>Info Box</CardTitle>
            <CardDescription>Information display component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <InfoBox icon={<Info />}>
                This is an info box with an icon. It's useful for displaying helpful information or tips.
              </InfoBox>
              
              <InfoBox>
                This is an info box without an icon. Still useful for general information display.
              </InfoBox>
            </div>
            <code className="text-xs text-gray-500 mt-4 block">
              {'<InfoBox icon={<Info />}>This is an info box...</InfoBox>'}
            </code>
          </CardContent>
        </Card>

        {/* Data Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Data Tables</CardTitle>
            <CardDescription>Structured data display</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>ID</DataTableHead>
                  <DataTableHead>Name</DataTableHead>
                  <DataTableHead>Role</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {sampleData.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell>{item.id}</DataTableCell>
                    <DataTableCell>{item.name}</DataTableCell>
                    <DataTableCell>{item.role}</DataTableCell>
                    <DataTableCell>
                      {item.status === 'Active' ? (
                        <SuccessBadge>{item.status}</SuccessBadge>
                      ) : (
                        <NeutralBadge>{item.status}</NeutralBadge>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
            <code className="text-xs text-gray-500 mt-4 block">
              {'<DataTable><DataTableHeader>...</DataTableHeader></DataTable>'}
            </code>
          </CardContent>
        </Card>

        {/* Modals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Modals</CardTitle>
            <CardDescription>Modal dialog components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => setIsModalOpen(true)}>
                Open Standard Modal
              </Button>
              <Button variant="outline" onClick={() => setIsActionModalOpen(true)}>
                Open Action Modal
              </Button>
            </div>
            <code className="text-xs text-gray-500 mt-4 block">
              {'<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">...</Modal>'}
            </code>
          </CardContent>
        </Card>

        {/* Import Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Import Examples</CardTitle>
            <CardDescription>How to import and use components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Import from Design System:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  PrimaryAction,
  PageTitle,
  SuccessBadge,
  DataTable,
  Modal,
  InfoBox
} from '@/components/ui/design-system';`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Usage Example:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<Card>
  <CardHeader>
    <CardTitle>Example Card</CardTitle>
  </CardHeader>
  <CardContent>
    <PrimaryAction>Click Me</PrimaryAction>
  </CardContent>
</Card>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Components */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Standard Modal"
          icon={<Info />}
        >
          <div className="space-y-4">
            <p>This is a standard modal component from the design system.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>

        <ActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title="Action Modal"
          icon={<Settings />}
        >
          <div className="space-y-4">
            <p>This is an action modal component from the design system.</p>
            <InfoBox icon={<User />}>
              Action modals are identical to standard modals but with semantic naming.
            </InfoBox>
            <div className="flex justify-end gap-2">
              <OutlineAction onClick={() => setIsActionModalOpen(false)}>
                Cancel
              </OutlineAction>
              <PrimaryAction onClick={() => setIsActionModalOpen(false)}>
                Execute Action
              </PrimaryAction>
            </div>
          </div>
        </ActionModal>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
