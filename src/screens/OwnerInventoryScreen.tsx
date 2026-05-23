import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, MoreVertical, Edit2, Trash2, ExternalLink, Share2, Eye, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMaster } from '../context/MasterContext';

export function OwnerInventoryScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const { catalogItems: inventory, removeItem, loading } = useMaster();

  const handleShareCatalog = () => {
    toast.success('Public catalog link copied!', {
      description: 'Your customers can now browse your active listings.'
    });
  };

  const handlePreviewItem = (id: string) => {
    navigate(`/items/${id}`);
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this item from the catalog?")) {
      return;
    }
    try {
      await removeItem(id);
      toast.success('Item removed from catalog');
    } catch (e) {
      toast.error('Failed to remove item. Please try again.');
    }
  };

  const handleDownloadCatalog = () => {
    try {
      const heading = `=========================================\n`;
      const title   = `        JS-TIP PRODUCT CATALOG           \n`;
      const dateStr = `   Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      const line    = `-----------------------------------------\n`;
      
      let content = heading + title + dateStr + heading + `\n`;
      
      inventory.forEach((item, index) => {
        content += `${index + 1}. ${item.name.toUpperCase()}\n`;
        content += `   💵 Publish Price: Rp ${item.price.toLocaleString()}\n`;
        content += `   📍 Status       : ${item.status.toUpperCase()}\n`;
        content += `   ✏️ Reference ID : #00${item.id}\n`;
        content += `${line}\n`;
      });
      
      content += `Thank you for shopping with us!\nContact us for custom pre-orders.\n`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Product_Catalog_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Catalog downloaded successfully!', {
        description: 'Every active item catalog is attached with publish price.'
      });
    } catch (e) {
      toast.error('Failed to download catalog.');
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/5">
      <header className="sticky top-0 z-50 bg-background border-b px-4 h-16 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/owner')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold flex-1">My Catalog</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full h-9 gap-2 font-bold text-[10px]" onClick={handleShareCatalog}>
            <Share2 className="h-3 w-3" /> SHARE
          </Button>
          <Button size="icon" className="rounded-full h-9 w-9" onClick={() => navigate('/owner/list-item')}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search your products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background border-none shadow-sm rounded-xl" 
            />
          </div>
          <Button 
            variant="outline" 
            className="h-11 rounded-xl bg-white border-none shadow-sm font-black text-[10px] uppercase gap-1.5 px-3 flex items-center justify-center text-primary hover:bg-muted shrink-0"
            onClick={handleDownloadCatalog}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredInventory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card 
                className="border-none shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-3 flex gap-4">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    <div className="absolute top-1 left-1">
                       <Badge className="bg-green-500/90 text-white text-[8px] h-4 px-1 leading-none border-none">LIVE</Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold truncate pr-2">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Active for Request</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                          onClick={(e) => e.stopPropagation()} 
                          className="inline-flex h-8 w-8 -mr-1 items-center justify-center rounded-lg hover:bg-muted transition-colors outline-none"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem className="gap-2 text-xs font-medium" onClick={(e) => { e.stopPropagation(); navigate(`/owner/edit-item/${item.id}`); }}>
                            <Edit2 className="h-3 w-3" /> Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('Product link copied!', {
                                description: 'Share this link with your customers.'
                              });
                            }}
                          >
                            <ExternalLink className="h-3 w-3" /> Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-medium text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(item.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-black text-primary">Rp {item.price.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Est. Margin: +Rp 45k</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Catalog Product Detail Popup Modal */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent className="rounded-3xl border-none max-w-[90%] md:max-w-md bg-white p-6 max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <div className="space-y-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
                  <Info className="h-4.5 w-4.5" /> Catalog Product Detail
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Reference ID: #00{selectedItem.id} • Active Status
                </DialogDescription>
              </DialogHeader>

              {/* Cover Image & Name block */}
              <div className="space-y-3">
                <div className="relative h-44 w-full rounded-2xl overflow-hidden border bg-muted/20">
                  <img src={selectedItem.image} alt={selectedItem.name} className="h-full w-full object-cover" />
                  <Badge className="absolute top-3 left-3 bg-green-500 text-white font-bold text-[9px] tracking-wider uppercase">ACTIVE PRODUCT</Badge>
                </div>
                <h3 className="text-base font-black text-slate-800 leading-snug uppercase italic tracking-tight">{selectedItem.name}</h3>
              </div>

              {/* Financial Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Publish Price (IDR)</p>
                  <p className="text-sm font-black text-primary font-mono">Rp {selectedItem.price.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Est. Cost</p>
                  <p className="text-sm font-black text-emerald-700 font-mono">{selectedItem.cost} {selectedItem.currency}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/60 flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Estimated Margin</span>
                <span className="text-xs font-black text-indigo-805 text-indigo-800 bg-white px-2.5 py-1 rounded-xl shadow-sm border border-indigo-100/40">+Rp 45,000 (Sourcing Reward)</span>
              </div>

              {/* Action Buttons inside custom popup modal details */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <Button 
                  className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider italic flex items-center justify-center gap-2"
                  onClick={() => {
                    const id = selectedItem.id;
                    setSelectedItem(null);
                    navigate(`/owner/edit-item/${id}`);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Catalog Item
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="h-10 rounded-xl text-[10px] font-bold uppercase"
                    onClick={() => {
                      const id = selectedItem.id;
                      setSelectedItem(null);
                      handlePreviewItem(id);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Storefront
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-10 rounded-xl text-[10px] font-bold uppercase"
                    onClick={() => {
                      toast.success('Product link copied!', {
                        description: 'Share this link with your customers.'
                      });
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share Link
                  </Button>
                </div>

                <Button 
                  variant="ghost"
                  className="w-full h-10 rounded-xl text-[10px] font-bold uppercase text-red-500 hover:bg-red-50"
                  onClick={() => {
                    const id = selectedItem.id;
                    setSelectedItem(null);
                    handleRemove(id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove from Catalog
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
