
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import { Textarea } from "assets/components/ui/textarea";
import type {
    DifficultyLevel,
    Exercise,
    ExerciseCategory
} from "feature/exercisePlan/types/exercise.types";
import { AlignLeft, Clock, Dumbbell, HelpCircle, Image as ImageIcon,List, Plus, Tag, Trash2, Youtube } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface CreateCustomExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseCreate: (exercise: Exercise) => void;
}

export const CreateCustomExerciseDialog = ({
  open,
  onOpenChange,
  onExerciseCreate,
}: CreateCustomExerciseDialogProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("5");
  const [category, setCategory] = useState<ExerciseCategory>("technique");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  
  const [instructions, setInstructions] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState("");
  
  const [tips, setTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isImageValid, setIsImageValid] = useState(true);

  const handleAddInstruction = () => {
      if (currentInstruction.trim()) {
          setInstructions([...instructions, currentInstruction.trim()]);
          setCurrentInstruction("");
      }
  };

  const handleRemoveInstruction = (index: number) => {
      setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleAddTip = () => {
      if (currentTip.trim()) {
          setTips([...tips, currentTip.trim()]);
          setCurrentTip("");
      }
  };

  const handleRemoveTip = (index: number) => {
      setTips(tips.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) {
        toast.error(t("exercises:custom_exercise.title_required"));
        return;
    }

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      title: title,
      description: description,
      difficulty,
      category,
      timeInMinutes: parseInt(duration) || 5,
      instructions: instructions,
      tips: tips,
      metronomeSpeed: null,
      relatedSkills: [],
      videoUrl: videoUrl.trim() || null,
      imageUrl: imageUrl.trim() || null,
    };

    onExerciseCreate(newExercise);
    onOpenChange(false);
    resetForm();
    toast.success(t("exercises:custom_exercise.created_success"));
  };

  const resetForm = () => {
      setTitle("");
      setDescription("");
      setDuration("5");
      setCategory("technique");
      setDifficulty("medium");
      setInstructions([]);
      setTips([]);
      setCurrentInstruction("");
      setCurrentTip("");
      setVideoUrl("");
      setImageUrl("");
      setIsImageValid(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl bg-zinc-950 border-l border-white/10 text-zinc-100 flex flex-col h-full p-0">
        <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
            <SheetHeader>
                <SheetTitle className="text-xl">{t("exercises:custom_exercise.title")}</SheetTitle>
                <SheetDescription>
                    {t("exercises:custom_exercise.description")}
                </SheetDescription>
            </SheetHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            <form id="create-exercise-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Title and Description Group */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-zinc-300 font-medium">{t("exercises:custom_exercise.exercise_title")}</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Spider Walk"
                        className="bg-zinc-900 border-zinc-800 focus:ring-cyan-500/50 h-10"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2 text-zinc-300 font-medium">
                        <AlignLeft className="h-4 w-4 text-cyan-500" />
                        {t("exercises:custom_exercise.exercise_desc")}
                    </Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="..."
                        className="bg-zinc-900 border-zinc-800 focus:ring-cyan-500/50 min-h-[100px] resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="flex items-center gap-2 text-zinc-300 font-medium">
                        <Youtube className="h-4 w-4 text-red-500" />
                        {t("exercises:custom_exercise.video_url", { defaultValue: "YouTube Link" })}
                    </Label>
                    <Input
                        id="videoUrl"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-zinc-900 border-zinc-800 focus:ring-red-500/50 h-10"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="flex items-center gap-2 text-zinc-300 font-medium">
                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                        {t("exercises:custom_exercise.image_url", { defaultValue: "Image URL (Tab/Score)" })}
                    </Label>
                    <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => {
                            setImageUrl(e.target.value);
                            setIsImageValid(true);
                        }}
                        placeholder="https://example.com/image.png"
                        className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500/50 h-10"
                    />
                    {imageUrl && (
                        <div className="mt-2 relative aspect-[3.5/1] w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
                            <img 
                                src={imageUrl} 
                                alt="Preview" 
                                className="h-full w-full object-contain"
                                onError={() => setIsImageValid(false)}
                                onLoad={() => setIsImageValid(true)}
                            />
                            {!isImageValid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-rose-500 text-xs font-medium">
                                    {t("exercises:custom_exercise.invalid_image", { defaultValue: "Invalid image URL" })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-zinc-900/30 rounded-xl border border-white/5">
                <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Clock className="h-4 w-4 text-amber-500" />
                        {t("exercises:custom_exercise.duration")}
                    </Label>
                    <div className="relative">
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 focus:ring-amber-500/50 pl-3"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="difficulty" className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Dumbbell className="h-4 w-4 text-rose-500" />
                        {t("exercises:custom_exercise.difficulty")}
                    </Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-rose-500/50 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="easy">{t("exercises:difficulty.easy")}</SelectItem>
                            <SelectItem value="medium">{t("exercises:difficulty.medium")}</SelectItem>
                            <SelectItem value="hard">{t("exercises:difficulty.hard")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                     <Label htmlFor="category" className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Tag className="h-4 w-4 text-emerald-500" />
                        {t("exercises:custom_exercise.category")}
                    </Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500/50 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="technique">{t("exercises:categories.technique")}</SelectItem>
                            <SelectItem value="theory">{t("exercises:categories.theory")}</SelectItem>
                            <SelectItem value="creativity">{t("exercises:categories.creativity")}</SelectItem>
                            <SelectItem value="hearing">{t("exercises:categories.hearing")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2 text-zinc-300 font-medium">
                    <List className="h-4 w-4 text-purple-500" />
                    {t("exercises:custom_exercise.instructions")}
                </Label>
                <div className="flex gap-2">
                    <Input 
                        value={currentInstruction}
                        onChange={(e) => setCurrentInstruction(e.target.value)}
                        placeholder={t("exercises:custom_exercise.add_instruction_placeholder")}
                        className="bg-zinc-900 border-zinc-800 focus:ring-purple-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInstruction())}
                    />
                    <Button type="button" onClick={handleAddInstruction} size="icon" className="bg-zinc-800 hover:bg-zinc-700 shrink-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {instructions.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                        {instructions.map((inst, index) => (
                            <li key={index} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-zinc-900/40 border border-white/5 text-sm group">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-xs text-zinc-400 shrink-0 mt-0.5">
                                    {index + 1}
                                </span>
                                <span className="text-zinc-300 break-words flex-1 leading-relaxed">{inst}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveInstruction(index)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-zinc-500 italic pl-1">
                        {t("exercises:custom_exercise.no_instructions_hint", { defaultValue: "No instructions added yet." })}
                    </p>
                )}
            </div>

            {/* Tips */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2 text-zinc-300 font-medium">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    {t("exercises:custom_exercise.tips")}
                </Label>
                <div className="flex gap-2">
                    <Input 
                        value={currentTip}
                        onChange={(e) => setCurrentTip(e.target.value)}
                        placeholder={t("exercises:custom_exercise.add_tip_placeholder")}
                        className="bg-zinc-900 border-zinc-800 focus:ring-blue-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTip())}
                    />
                    <Button type="button" onClick={handleAddTip} size="icon" className="bg-zinc-800 hover:bg-zinc-700 shrink-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 {tips.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                        {tips.map((tip, index) => (
                            <li key={index} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm group">
                                <div className="mt-0.5 shrink-0">
                                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                </div>
                                <span className="text-zinc-300 break-words flex-1 leading-relaxed">{tip}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveTip(index)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-xs text-zinc-500 italic pl-1">
                        {t("exercises:custom_exercise.no_tips_hint", { defaultValue: "No tips added yet." })}
                    </p>
                )}
            </div>
            </form>
        </div>

        <div className="p-6 border-t border-white/10 bg-zinc-950 shrink-0">
            <SheetFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto mt-2 sm:mt-0 border-zinc-700 hover:bg-zinc-800">
                    {t("common:cancel" as any)}
                </Button>
                <Button type="submit" form="create-exercise-form" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200">
                    {t("common:create" as any)}
                </Button>
            </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
