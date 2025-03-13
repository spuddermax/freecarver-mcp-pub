# PulseUpdateButton Component

A reusable button component that provides visual feedback to users about unsaved changes through a pulsing animation and a tooltip that displays the specific changes that will be saved.

## Features

- **Pulsing Animation**: Provides visual indication when there are unsaved changes
- **Change Tooltip**: Shows detailed information about pending changes on hover
- **Revert Functionality**: Optional button to revert all changes
- **Loading State**: Displays loading text when an action is in progress
- **Disabled State**: Visually indicates when the button cannot be clicked

## Usage

```tsx
import PulseUpdateButton, { pulseAnimationCSS } from "../components/PulseUpdateButton";

// First, add the CSS to your component
<style>{pulseAnimationCSS}</style>

// Basic usage
<PulseUpdateButton
  onClick={handleSave}
  label="Save Changes"
  icon={<SaveIcon className="h-4 w-4" />}
/>

// With pulsing and changes
<PulseUpdateButton
  onClick={handleSave}
  showPulse={hasUnsavedChanges}
  label="Update Product"
  icon={<SaveIcon className="h-4 w-4" />}
  changes={[
    "Name: Changed from 'Product A' to 'Product B'",
    "Price: Changed from $10 to $15"
  ]}
  onRevert={handleRevertChanges}
  disabled={isSaving}
  isLoading={isSaving}
/>
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `onClick` | `(e: React.MouseEvent<HTMLButtonElement>) => void` | Function to call when button is clicked | Required |
| `disabled` | `boolean` | Whether the button is disabled | `false` |
| `showPulse` | `boolean` | Whether to show the pulsing animation | `false` |
| `label` | `string` | Text to display on the button | Required |
| `icon` | `React.ReactNode` | Icon to display before the label | Optional |
| `changes` | `string[]` | Array of strings describing changes to show in tooltip | `[]` |
| `onRevert` | `() => void` | Function to call when revert button is clicked | Optional |
| `isLoading` | `boolean` | Whether to show loading state | `false` |
| `tooltipTitle` | `string` | Title for the changes tooltip | "Unsaved Changes:" |
| `revertButtonLabel` | `string` | Text for the revert button | "Revert All Changes" |
| `className` | `string` | Additional CSS classes for the container | `""` |

## Example Implementation

```tsx
// Example usage in a form component
function ProductEditor() {
  const [product, setProduct] = useState({ name: "Product", price: 10 });
  const [originalProduct, setOriginalProduct] = useState({ name: "Product", price: 10 });
  const [saving, setSaving] = useState(false);
  
  // Check if there are any changes
  const hasChanges = useMemo(() => {
    return product.name !== originalProduct.name || 
           product.price !== originalProduct.price;
  }, [product, originalProduct]);
  
  // Generate descriptions of changes
  const changesList = useMemo(() => {
    const changes = [];
    if (product.name !== originalProduct.name) {
      changes.push(`Name: "${originalProduct.name}" → "${product.name}"`);
    }
    if (product.price !== originalProduct.price) {
      changes.push(`Price: $${originalProduct.price} → $${product.price}`);
    }
    return changes;
  }, [product, originalProduct]);
  
  // Handle reverting changes
  const handleRevert = () => {
    setProduct({ ...originalProduct });
  };
  
  // Handle saving changes
  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save changes
      await saveProduct(product);
      setOriginalProduct({ ...product });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div>
      <style>{pulseAnimationCSS}</style>
      {/* Form fields */}
      <div className="flex justify-end mt-4">
        <PulseUpdateButton
          onClick={handleSave}
          disabled={!hasChanges || saving}
          showPulse={hasChanges}
          label="Save Product"
          icon={<SaveIcon className="h-4 w-4" />}
          changes={changesList}
          onRevert={hasChanges ? handleRevert : undefined}
          isLoading={saving}
        />
      </div>
    </div>
  );
}
``` 