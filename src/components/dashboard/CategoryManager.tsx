'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Zap, Settings as SettingsIcon, AlertCircle, Wrench, Droplet, Wind, Shield, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const AVAILABLE_ICONS = [
  { name: 'Zap', icon: Zap },
  { name: 'Settings', icon: SettingsIcon },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Wrench', icon: Wrench },
  { name: 'Droplet', icon: Droplet },
  { name: 'Wind', icon: Wind },
  { name: 'Shield', icon: Shield },
  { name: 'Monitor', icon: Monitor },
];

export function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Settings');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCategories(json.data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setDescription(cat.description || '');
      setIconName(cat.icon || 'Settings');
    } else {
      setEditingCat(null);
      setName('');
      setDescription('');
      setIconName('Settings');
    }
    setIsModalOpen(true);
  };

  const saveCategory = async () => {
    if (!name.trim()) return toast.error('Name is required');
    
    setIsSaving(true);
    try {
      const payload = { name, description, icon: iconName };
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      const method = editingCat ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Category ${editingCat ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete category');
    }
  };

  const renderIcon = (name: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === name);
    const IconComponent = found ? found.icon : SettingsIcon;
    return <IconComponent className="w-5 h-5 text-brand-navy" />;
  };

  if (loading) {
    return <div className="py-12 text-center text-brand-gray animate-pulse">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Request Categories</h2>
          <p className="text-sm text-brand-gray">Manage the types of issues students can report.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-brand-coral hover:bg-brand-coral-hover text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-canvas border-b border-border text-sm font-semibold text-brand-navy">
              <th className="p-4">Icon</th>
              <th className="p-4">Name</th>
              <th className="p-4 hidden sm:table-cell">Description</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-brand-canvas/50 transition-colors group">
                <td className="p-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-canvas border border-border flex items-center justify-center">
                    {renderIcon(cat.icon)}
                  </div>
                </td>
                <td className="p-4 font-medium text-brand-navy">{cat.name}</td>
                <td className="p-4 hidden sm:table-cell text-sm text-brand-gray">{cat.description}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openModal(cat)} className="h-8 w-8 text-brand-gray hover:text-brand-navy">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-brand-gray text-sm">
                  No categories found. Create your first one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Electrical" />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the category" />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map((i) => {
                  const IconComp = i.icon;
                  const isSelected = iconName === i.name;
                  return (
                    <button
                      key={i.name}
                      onClick={() => setIconName(i.name)}
                      className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-brand-coral bg-brand-coral/10 text-brand-coral' 
                          : 'border-border bg-brand-canvas hover:bg-brand-canvas/80 text-brand-navy'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={isSaving} className="bg-brand-coral hover:bg-brand-coral-hover text-white">
              {isSaving ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
