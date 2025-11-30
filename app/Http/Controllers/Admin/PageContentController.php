<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageContentController extends Controller
{
    /**
     * Display a listing of pages
     */
    public function index(Request $request)
    {
        $query = PageContent::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('page_slug', 'ilike', "%{$search}%");
            });
        }

        $pages = $query->orderBy('page_slug')
            ->paginate(15)
            ->through(fn($page) => [
                'id' => $page->id,
                'page_slug' => $page->page_slug,
                'title' => $page->title,
                'meta_title' => $page->meta_title,
                'is_active' => $page->is_active,
                'created_at' => $page->created_at,
                'updated_at' => $page->updated_at,
            ]);

        return Inertia::render('Admin/Pages/Index', [
            'pages' => $pages,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new page
     */
    public function create(Request $request)
    {
        $pageSlug = $request->get('slug', 'vendor-guide');

        return Inertia::render('Admin/Pages/Create', [
            'pageSlug' => $pageSlug,
        ]);
    }

    /**
     * Store a newly created page
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'page_slug' => ['required', 'string', 'max:100', 'unique:page_contents,page_slug'],
            'title' => ['required', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'array'],
            'is_active' => ['boolean'],
        ]);

        PageContent::create($validated);

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page created successfully.');
    }

    /**
     * Show the form for editing the specified page
     */
    public function edit(PageContent $page)
    {
        return Inertia::render('Admin/Pages/Edit', [
            'page' => [
                'id' => $page->id,
                'page_slug' => $page->page_slug,
                'title' => $page->title,
                'meta_title' => $page->meta_title,
                'meta_description' => $page->meta_description,
                'content' => $page->content,
                'is_active' => $page->is_active,
            ],
        ]);
    }

    /**
     * Update the specified page
     */
    public function update(Request $request, PageContent $page)
    {
        $validated = $request->validate([
            'page_slug' => ['required', 'string', 'max:100', 'unique:page_contents,page_slug,' . $page->id],
            'title' => ['required', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'array'],
            'is_active' => ['boolean'],
        ]);

        $page->update($validated);

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page updated successfully.');
    }

    /**
     * Remove the specified page
     */
    public function destroy(PageContent $page)
    {
        $page->delete();

        return redirect()->route('admin.pages.index')
            ->with('success', 'Page deleted successfully.');
    }
}
