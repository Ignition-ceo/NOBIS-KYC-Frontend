import { useState, useEffect } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Note {
  id: string;
  body: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

interface ApplicantNotesProps {
  applicantId: string;
}

const STORAGE_KEY_PREFIX = "nobis_applicant_notes_";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function ApplicantNotes({ applicantId }: ApplicantNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  // Load notes from localStorage
  const loadNotes = () => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${applicantId}`);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch {
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [applicantId]);

  // Listen for external note updates (e.g., system notes from status changes)
  useEffect(() => {
    const handleNotesUpdated = (event: CustomEvent<{ applicantId: string }>) => {
      if (event.detail.applicantId === applicantId) {
        loadNotes();
      }
    };

    window.addEventListener("applicant-notes-updated", handleNotesUpdated as EventListener);
    return () => {
      window.removeEventListener("applicant-notes-updated", handleNotesUpdated as EventListener);
    };
  }, [applicantId]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${applicantId}`,
      JSON.stringify(updatedNotes)
    );
    setNotes(updatedNotes);
  };

  const handleAddNote = () => {
    if (!newText.trim()) return;

    setSaving(true);

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      body: newText.trim(),
      authorName: "Admin",
      authorId: "admin",
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setNewText("");
    setSaving(false);
    toast.success("Note added");
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    saveNotes(updatedNotes);
    toast.success("Note deleted");
  };

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Notes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Internal notes for screenings, approvals, and follow-ups.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs font-medium bg-muted/60 border border-border/60"
          >
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Composer */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a note (e.g., 'AML hit reviewed — false positive. Approved with review.')..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="min-h-[90px] rounded-xl resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Visible to admins only.
            </span>
            <Button
              onClick={handleAddNote}
              disabled={!newText.trim() || saving}
              className="h-9 gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>

        <Separator />

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-center">
              <p className="text-sm font-medium text-muted-foreground/80">
                No notes yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add your first note above to capture review decisions and
                context.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-border/60 bg-background p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                        {getInitials(note.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {note.authorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
