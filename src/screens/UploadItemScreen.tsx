import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Camera, 
  ArrowLeft, 
  Check, 
  Info,
  X,
  Save,
  Share2,
  Image as ImageIcon,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMaster } from '../context/MasterContext';
import { isAiConfigured, analyzeProductImage } from '../lib/ai';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';

export function UploadItemScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { loading, catalogItems, tripSettings, saveItem } = useMaster();

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [publishPrice, setPublishPrice] = useState('');
  const [settings, setSettings] = useState<any>({
    code: 'SGD',
    symbol: 'S$',
    manualRate: 13500,
    realtimeRate: 13050,
    updatedAt: new Date().toISOString()
  });
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [bannerColor, setBannerColor] = useState('bg-white');

  const bannerColors = [
    { name: 'White', class: 'bg-white', text: 'text-slate-900', border: 'border-slate-200' },
    { name: 'Blue', class: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
    { name: 'Purple', class: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-400' },
    { name: 'Black', class: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
    { name: 'Pink', class: 'bg-rose-500', text: 'text-white', border: 'border-rose-300' },
  ];

  useEffect(() => {
    if (!loading) {
      if (tripSettings && tripSettings.currency) {
        setSettings(tripSettings.currency);
      }

      if (isEdit && catalogItems) {
        const item = catalogItems.find((i: any) => i.id === id);
        if (item) {
          setImage(item.image);
          setName(item.name);
          setPrice(item.cost.toString());
          setPublishPrice(item.price.toString());
        }
      }
    }
  }, [id, isEdit, loading, catalogItems, tripSettings]);

  const basePriceIdr = Number(price) * settings.manualRate;
  const margin = Number(publishPrice) - basePriceIdr;
  const marginPercentage = basePriceIdr > 0 ? (margin / basePriceIdr) * 100 : 0;

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const processImageWithAI = async (dataUrl: string) => {
    setImage(dataUrl);
    if (!isAiConfigured() || isEdit) return;

    setIsAnalyzing(true);
    toast.info('AI is analyzing the product...', { icon: <Sparkles className="h-4 w-4 text-amber-500" /> });
    
    try {
      const result = await analyzeProductImage(dataUrl);
      if (result) {
        if (result.name) setName(result.name);
        if (result.price > 0) {
          setPrice(result.price.toString());
          // Auto-calculate a 20% margin for the publish price as a smart default
          const costIdr = result.price * settings.manualRate;
          const suggestedPublishPrice = Math.ceil((costIdr * 1.2) / 1000) * 1000;
          setPublishPrice(suggestedPublishPrice.toString());
        }
        toast.success('AI filled in product details!');
      } else {
        toast.error('AI could not identify the product.');
      }
    } catch (e) {
      console.error(e);
      toast.error('AI analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        processImageWithAI(dataUrl);
        toast.success('Photo uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing environment camera, falling back:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (fallbackErr: any) {
        console.error("Error accessing camera fallback:", fallbackErr);
        setCameraError("Unable to access camera. Please check permissions or upload a file instead.");
        toast.error("Camera access failed");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        toast.success('Photo captured!');
        setIsCameraOpen(false);
        stopCamera();
        processImageWithAI(dataUrl);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price || !publishPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const itemToSave = {
      id: id || 'item_' + Date.now(),
      name: name.trim(),
      price: Number(publishPrice),
      cost: Number(price),
      currency: settings.code,
      image: image || '',
      status: 'active'
    };

    try {
      await saveItem(itemToSave);
      toast.success(isEdit ? 'Changes saved!' : 'Item listed successfully!', {
        description: isEdit ? 'Your product catalog has been updated.' : 'Your item is now visible to matched customers.',
      });
      navigate(-1);
    } catch (e) {
      toast.error('Failed to save item. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b h-16 flex items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">{isEdit ? 'Edit Product' : 'List New Item'}</h2>
      </header>

      <div className="p-6 space-y-8">
        {/* Photo Upload Section */}
        <section className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Photo Reference</label>
          {image ? (
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-xl group">
              <img src={image} alt="Preview" className={`w-full h-full object-cover transition-all ${isAnalyzing ? 'blur-sm scale-105 brightness-50' : ''}`} />
              
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
                    <Sparkles className="h-12 w-12 text-primary animate-bounce relative z-10" />
                  </div>
                  <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2 shadow-xl border border-primary/20">
                    <Loader2 className="h-3 w-3 animate-spin" /> AI Analyzing...
                  </div>
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <button 
                  onClick={() => setShowShareBanner(true)}
                  className="h-10 w-10 rounded-full bg-primary/80 backdrop-blur-md text-white flex items-center justify-center transition-transform hover:scale-110"
                  title="Generate Share Banner"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setImage(null)}
                  className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-transform hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {showShareBanner && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 gap-6"
                >
                  <div className={`${bannerColors.find(c => c.class === bannerColor)?.class || 'bg-white'} rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl relative transition-colors duration-300`}>
                    <div className="relative aspect-square">
                      <img src={image} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                        <div className="space-y-1 text-left">
                          <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Available for Request</p>
                          <h3 className="text-white text-2xl font-black leading-tight uppercase italic">{name || "Your Item"}</h3>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 bg-primary text-white font-black px-4 py-2 rounded-2xl shadow-xl rotate-3">
                        Rp {publishPrice ? Number(publishPrice).toLocaleString() : "0"}
                      </div>
                    </div>
                    <div className={`p-5 ${bannerColors.find(c => c.class === bannerColor)?.text || 'text-slate-900'} flex items-center justify-between`}>
                       <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full border ${bannerColors.find(c => c.class === bannerColor)?.border || 'border-slate-200'} flex items-center justify-center text-xs font-black uppercase italic`}>JF</div>
                          <div className="space-y-0.5">
                            <span className="block text-[10px] font-black uppercase tracking-wider opacity-60">Fulfill via</span>
                            <span className="block text-sm font-black uppercase italic tracking-tighter">JStip Platform</span>
                          </div>
                       </div>
                       <ImageIcon className="h-5 w-5 opacity-30" />
                    </div>
                    <button 
                      onClick={() => setShowShareBanner(false)}
                      className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/20 text-white/50 hover:bg-black/40 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Color Selector */}
                  <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl flex gap-2 border border-white/10">
                    {bannerColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setBannerColor(color.class)}
                        className={`h-8 w-8 rounded-xl ${color.class} border-2 transition-transform hover:scale-110 ${bannerColor === color.class ? 'border-primary ring-2 ring-primary/20' : 'border-white/20'}`}
                        title={color.name}
                      />
                    ))}
                  </div>

                  <div className="w-full max-w-sm px-4">
                    <Button variant="secondary" className="w-full h-14 rounded-2xl gap-2 font-black italic text-sm shadow-xl" onClick={() => {
                      toast.success('Banner ready to share!');
                      setShowShareBanner(false);
                    }}>
                      <Save className="h-5 w-5" /> DOWNLOAD FOR STORY
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square border-4 border-dashed rounded-3xl flex flex-col items-center justify-center gap-6 bg-muted/20 p-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="h-10 w-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm">Add Product Photo</p>
                <p className="text-xs text-muted-foreground">Take a picture or choose a file</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <Button 
                  type="button"
                  onClick={() => {
                    setIsCameraOpen(true);
                    startCamera();
                  }}
                  className="rounded-xl font-bold text-xs h-11 bg-primary text-white flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" /> Use Camera
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="rounded-xl font-bold text-xs h-11 border-2 border-primary/20 text-primary bg-background hover:bg-muted/30 transition-colors flex items-center justify-center gap-1.5 w-full">
                    <ImageIcon className="h-4 w-4" /> Upload File
                  </div>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* Pricing Information */}
        <section className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pricing & Currency</label>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-none">Rate: 1 {settings.code} = Rp {settings.manualRate.toLocaleString()}</Badge>
          </div>
          
          <Card className="border-none bg-muted/30 overflow-hidden">
            <CardContent className="p-5 space-y-6">
              {/* Foreign Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Cost Price ({settings.code})</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{settings.symbol}</div>
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    className="h-14 pl-10 rounded-2xl bg-background border-none text-lg font-bold"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                {basePriceIdr > 0 && (
                  <p className="text-[10px] font-medium text-muted-foreground px-1 uppercase">
                    = Rp {basePriceIdr.toLocaleString()} (Cost Base)
                  </p>
                )}
              </div>

              {/* Publish Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase px-1">Publish Price (IDR)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">Rp</div>
                  <Input 
                    type="number"
                    placeholder="Selling Price to Customer" 
                    className="h-14 pl-10 rounded-2xl bg-background border-2 border-primary/20 text-lg font-bold text-primary focus:border-primary"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Margin Card */}
              {Number(publishPrice) > 0 && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${margin > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="space-y-0.5">
                    <p className={`text-[10px] font-bold uppercase ${margin > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Expected Gross Margin
                    </p>
                    <p className={`text-xl font-black ${margin > 0 ? 'text-green-900' : 'text-red-900'}`}>
                      Rp {margin.toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${margin > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {marginPercentage > 0 ? '+' : ''}{marginPercentage.toFixed(1)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Product Details */}
        <section className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Product Details</label>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Product Name</label>
              <Input 
                placeholder="What are you selling?" 
                className="h-12 rounded-xl bg-muted/30 border-none px-4"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Button 
          className="w-full h-14 rounded-2xl font-bold text-lg gap-3 shadow-xl shadow-primary/20"
          onClick={handleSave}
          disabled={!image || !price || !name}
        >
          {isEdit ? <Save className="h-6 w-6" /> : <Check className="h-6 w-6" />}
          {isEdit ? 'Save Changes' : 'List For Sale'}
        </Button>
      </div>

      {/* Camera Capture Dialog */}
      <Dialog 
        open={isCameraOpen} 
        onOpenChange={(open) => {
          setIsCameraOpen(open);
          if (!open) {
            stopCamera();
          }
        }}
      >
        <DialogContent className="rounded-3xl border-none max-w-[95%] sm:max-w-md bg-white p-6 flex flex-col items-center gap-4">
          <DialogHeader className="text-left w-full">
            <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
              <Camera className="h-5 w-5" /> Capture Product Photo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Align your product inside the frame and take a photo.
            </DialogDescription>
          </DialogHeader>

          {/* Video Stream Container */}
          <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <Info className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-xs font-bold text-red-500">{cameraError}</p>
              </div>
            ) : !stream ? (
              <div className="text-center space-y-3">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing camera...</p>
              </div>
            ) : null}

            {/* Video element for stream preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${stream ? 'block' : 'hidden'}`}
            />

            {/* Pulse Indicator */}
            {stream && (
              <div className="absolute top-4 left-4 bg-red-500 text-white font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 w-full mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl font-bold text-xs h-12"
              onClick={() => {
                setIsCameraOpen(false);
                stopCamera();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!stream}
              className="flex-1 rounded-xl font-bold text-xs h-12 gap-1.5 bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              onClick={handleCapture}
            >
              <Camera className="h-4 w-4" /> Take Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
