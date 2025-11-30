<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index(Request $request)
    {
        $categories = Category::with(['children' => function ($query) {
                $query->withCount('products')->ordered();
            }])
            ->withCount('products')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->has('parent') && $request->parent === 'root', fn($q) => $q->whereNull('parent_id'))
            ->when($request->status === 'active', fn($q) => $q->where('is_active', true))
            ->when($request->status === 'inactive', fn($q) => $q->where('is_active', false))
            ->whereNull('parent_id')
            ->ordered()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total' => Category::count(),
            'root' => Category::whereNull('parent_id')->count(),
            'active' => Category::where('is_active', true)->count(),
            'featured' => Category::where('is_featured', true)->count(),
        ];

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'parent', 'status']),
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new category
     */
    public function create()
    {
        return Inertia::render('Admin/Categories/Create', [
            'parentCategories' => Category::whereNull('parent_id')
                ->active()
                ->ordered()
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
        }

        Category::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . Str::random(5),
            'parent_id' => $validated['parent_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'icon' => $validated['icon'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'is_featured' => $validated['is_featured'] ?? false,
        ]);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category created successfully!');
    }

    /**
     * Display the specified category
     */
    public function show(Category $category)
    {
        $category->load(['parent', 'children', 'products' => function ($query) {
            $query->with(['images', 'seller:id,shop_name'])->latest()->take(10);
        }]);

        return Inertia::render('Admin/Categories/Show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit(Category $category)
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
            'parentCategories' => Category::whereNull('parent_id')
                ->where('id', '!=', $category->id)
                ->active()
                ->ordered()
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:categories,id', 'not_in:' . $category->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
        ]);

        $data = [
            'name' => $validated['name'],
            'parent_id' => $validated['parent_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'is_featured' => $validated['is_featured'] ?? false,
        ];

        if ($request->hasFile('image')) {
            // Delete old image
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category updated successfully!');
    }

    /**
     * Remove the specified category
     */
    public function destroy(Category $category)
    {
        // Check if category has children
        if ($category->children()->exists()) {
            return back()->with('error', 'Cannot delete category with subcategories. Please delete or move subcategories first.');
        }

        // Check if category has products
        if ($category->products()->exists()) {
            return back()->with('error', 'Cannot delete category with products. Please reassign products first.');
        }

        // Delete image if exists
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category deleted successfully!');
    }

    /**
     * Update sort order for categories
     */
    public function updateOrder(Request $request)
    {
        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.id' => ['required', 'exists:categories,id'],
            'categories.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['categories'] as $item) {
            Category::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Category order updated successfully!');
    }

    /**
     * Toggle category status
     */
    public function toggleStatus(Category $category)
    {
        $category->update(['is_active' => !$category->is_active]);

        return back()->with('success', 'Category status updated successfully!');
    }

    /**
     * Toggle category featured status
     */
    public function toggleFeatured(Category $category)
    {
        $category->update(['is_featured' => !$category->is_featured]);

        return back()->with('success', 'Category featured status updated successfully!');
    }
}
