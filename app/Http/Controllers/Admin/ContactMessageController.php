<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactMessageController extends Controller
{
    /**
     * Display a listing of contact messages
     */
    public function index(Request $request)
    {
        $query = ContactMessage::query();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('subject', 'ilike', "%{$search}%");
            });
        }

        $messages = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn($message) => [
                'id' => $message->id,
                'name' => $message->name,
                'email' => $message->email,
                'phone' => $message->phone,
                'subject' => $message->subject,
                'message' => $message->message,
                'status' => $message->status,
                'read_at' => $message->read_at?->format('M d, Y H:i'),
                'replied_at' => $message->replied_at?->format('M d, Y H:i'),
                'created_at' => $message->created_at->format('M d, Y H:i'),
            ]);

        // Get counts for status tabs
        $statusCounts = [
            'all' => ContactMessage::count(),
            'new' => ContactMessage::where('status', 'new')->count(),
            'read' => ContactMessage::where('status', 'read')->count(),
            'replied' => ContactMessage::where('status', 'replied')->count(),
            'archived' => ContactMessage::where('status', 'archived')->count(),
        ];

        return Inertia::render('Admin/ContactMessages/Index', [
            'messages' => $messages,
            'statusCounts' => $statusCounts,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Display the specified message
     */
    public function show(ContactMessage $contactMessage)
    {
        // Mark as read when viewing
        $contactMessage->markAsRead();

        return Inertia::render('Admin/ContactMessages/Show', [
            'message' => [
                'id' => $contactMessage->id,
                'name' => $contactMessage->name,
                'email' => $contactMessage->email,
                'phone' => $contactMessage->phone,
                'subject' => $contactMessage->subject,
                'message' => $contactMessage->message,
                'status' => $contactMessage->status,
                'admin_notes' => $contactMessage->admin_notes,
                'read_at' => $contactMessage->read_at?->format('M d, Y H:i'),
                'replied_at' => $contactMessage->replied_at?->format('M d, Y H:i'),
                'created_at' => $contactMessage->created_at->format('M d, Y H:i'),
            ],
        ]);
    }

    /**
     * Update message status and notes
     */
    public function update(Request $request, ContactMessage $contactMessage)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:new,read,replied,archived'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'replied' && !$contactMessage->replied_at) {
                $validated['replied_at'] = now();
            }
        }

        $contactMessage->update($validated);

        return back()->with('success', 'Message updated successfully.');
    }

    /**
     * Mark message as replied
     */
    public function markAsReplied(ContactMessage $contactMessage)
    {
        $contactMessage->markAsReplied();

        return back()->with('success', 'Message marked as replied.');
    }

    /**
     * Archive the message
     */
    public function archive(ContactMessage $contactMessage)
    {
        $contactMessage->archive();

        return back()->with('success', 'Message archived.');
    }

    /**
     * Delete the message
     */
    public function destroy(ContactMessage $contactMessage)
    {
        $contactMessage->delete();

        return redirect()->route('admin.contact-messages.index')
            ->with('success', 'Message deleted successfully.');
    }

    /**
     * Bulk actions
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:contact_messages,id'],
            'action' => ['required', 'in:archive,delete,mark_read'],
        ]);

        $messages = ContactMessage::whereIn('id', $validated['ids']);

        switch ($validated['action']) {
            case 'archive':
                $messages->update(['status' => 'archived']);
                $msg = 'Messages archived successfully.';
                break;
            case 'delete':
                $messages->delete();
                $msg = 'Messages deleted successfully.';
                break;
            case 'mark_read':
                $messages->whereNull('read_at')->update([
                    'read_at' => now(),
                    'status' => 'read',
                ]);
                $msg = 'Messages marked as read.';
                break;
        }

        return back()->with('success', $msg);
    }
}
