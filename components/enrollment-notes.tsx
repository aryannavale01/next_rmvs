"use client";

import React, { useState } from "react";
import { MessageSquare, Plus, Send } from "lucide-react";

interface Note {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

interface EnrollmentNotesProps {
  applicationId: string;
  notes: Note[];
  onAddNote?: (text: string) => Promise<void>;
}

export default function EnrollmentNotes({ applicationId, notes, onAddNote }: EnrollmentNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || !onAddNote) return;
    setIsSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {onAddNote && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!newNote.trim() || isSubmitting}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="bg-muted/30 border border-border/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-medium text-muted-foreground">
                  {note.authorId === "system" ? "System" : "Admin"}
                </span>
                <span className="text-[9px] text-muted-foreground">{note.createdAt}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
