---
name: laravel
displayName: Laravel
description: Laravel 12 framework development patterns including routing, controllers, models, views, Livewire components, services, migrations, and best practices. Use when building Laravel apps, working with Eloquent, creating APIs, or using Livewire.
version: 1.0.0
---

# Laravel 12 Development Guidelines

Best practices for developing Laravel 12 applications with Livewire and Tailwind CSS.

## Core Principles

1. **Service Layer**: Keep business logic in Service classes, not controllers
2. **Form Requests**: Use Form Request classes for validation
3. **Resource Routes**: Use resource controllers when possible
4. **Policies**: Authorize actions with Policies, not gates in controllers
5. **Migrations**: Always use migrations for database changes
6. **Blade Components**: Use Blade components for reusable UI elements
7. **Livewire**: Use Livewire for dynamic frontend features

## Project Structure

```
app/
├── Http/
│   ├── Controllers/     # Handle HTTP requests
│   ├── Requests/        # Form validation
│   └── Middleware/      # Request middleware
├── Models/             # Eloquent models
├── Services/           # Business logic layer
├── Livewire/           # Livewire components
├── Policies/           # Authorization logic
└── Providers/          # Service providers
```

## Routing

### Basic Routes

```php
// routes/web.php
Route::get('/users', [UserController::class, 'index'])->name('users.index');
Route::post('/users', [UserController::class, 'store'])->name('users.store');
Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
Route::delete('/users/{user}', [UserController::class, 'delete'])->name('users.delete');
```

### Resource Routes

```php
// routes/web.php
Route::resource('users', UserController::class);

// With only specific routes
Route::resource('issues', IssueController::class)
    ->only(['index', 'show', 'create', 'store']);

// Nested resources
Route::resource('users.posts', PostController::class);
```

### Route Groups

```php
// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('issues', IssueController::class);
});

// Admin routes with prefix and name
Route::prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', AdminUserController::class);
    Route::resource('roles', AdminRoleController::class);
});
```

## Controllers

### Resource Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Http\Requests\StoreIssueRequest;
use App\Services\IssueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class IssueController extends Controller
{
    public function __construct(
        private IssueService $issueService
    ) {}

    public function index(): View
    {
        $issues = $this->issueService->getPaginatedIssues(15);
        return view('issues.index', compact('issues'));
    }

    public function create(): View
    {
        return view('issues.create');
    }

    public function store(StoreIssueRequest $request): RedirectResponse
    {
        $issue = $this->issueService->create($request->validated());
        return redirect()
            ->route('issues.show', $issue)
            ->with('success', 'Issue created successfully.');
    }

    public function show(Issue $issue): View
    {
        $issue->load(['departments', 'issueTypes', 'createdBy']);
        return view('issues.show', compact('issue'));
    }
}
```

## Models

### Eloquent Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Issue extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'priority',
        'status',
        'assigned_to_user_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    // Relationships
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeHighPriority($query)
    {
        return $query->where('priority', 'high');
    }

    // Accessors
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'open' => 'green',
            'closed' => 'gray',
            default => 'gray',
        };
    }
}
```

## Services

### Service Class

```php
<?php

namespace App\Services;

use App\Models\Issue;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class IssueService
{
    public function getPaginatedIssues(int $perPage = 15): LengthAwarePaginator
    {
        return Issue::query()
            ->with(['departments', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(array $data): Issue
    {
        $issue = Issue::create($data);

        if (isset($data['department_ids'])) {
            $issue->departments()->attach($data['department_ids']);
        }

        return $issue;
    }

    public function close(Issue $issue): void
    {
        $issue->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }
}
```

## Form Requests

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'department_ids' => ['array'],
            'department_ids.*' => ['exists:departments,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'The title is required.',
            'priority.in' => 'Invalid priority level.',
        ];
    }
}
```

## Livewire Components

### Basic Livewire Component

```php
<?php

namespace App\Livewire\Issues;

use App\Models\Issue;
use Livewire\Component;
use Livewire\WithPagination;

class Index extends Component
{
    use WithPagination;

    public string $search = '';
    public string $filter = 'all';

    protected $queryString = ['search', 'filter'];

    public function render()
    {
        $issues = Issue::query()
            ->when($this->search, fn($q) => $q->where('title', 'like', "%{$this->search}%"))
            ->when($this->filter === 'open', fn($q) => $q->where('status', 'open'))
            ->latest()
            ->paginate(15);

        return view('livewire.issues.index', [
            'issues' => $issues,
        ]);
    }

    public function closeIssue(int $issueId): void
    {
        $issue = Issue::findOrFail($issueId);
        $this->authorize('close', $issue);

        $issue->update(['status' => 'closed']);

        $this->dispatch('issue-closed');
    }
}
```

### Livewire Blade View

```blade
<div>
    <!-- Search -->
    <input wire:model.live.debounce.300ms="search" type="text" placeholder="Search...">

    <!-- Issues List -->
    @foreach($issues as $issue)
        <div wire:key="{{ $issue->id }}">
            <h3>{{ $issue->title }}</h3>
            <button wire:click="closeIssue({{ $issue->id }})">Close</button>
        </div>
    @endforeach

    <!-- Pagination -->
    {{ $issues->links() }}
</div>
```

## Blade Components

### Creating a Component

```bash
php artisan make:component Alert
# Creates: app/View/Components/Alert.php
#          resources/views/components/alert.blade.php
```

### Component Class

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public string $type;
    public string $message;

    public function __construct(string $type, string $message)
    {
        $this->type = $type;
        $this->message = $message;
    }

    public function render()
    {
        return view('components.alert');
    }
}
```

### Using Components

```blade
<!-- With attributes -->
<x-alert type="success" message="Issue created!" />

<!-- With slots -->
<x-card>
    <x-slot name="header">
        <h2>Card Title</h2>
    </x-slot>
    <p>Card content here.</p>
</x-card>

<!-- Anonymous components -->
<x-button.primary>Submit</x-button.primary>
```

## Migrations

### Creating Migrations

```bash
php artisan make:migration create_issues_table
```

### Migration Structure

```php
<?php

use App\Enums\IssuePriority;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->foreignId('assigned_to_user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'created_at']);
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
```

## Policies

### Creating a Policy

```bash
php artisan make:policy IssuePolicy --model=Issue
```

### Policy Class

```php
<?php

namespace App\Policies;

use App\Models\Issue;
use App\Models\User;

class IssuePolicy
{
    public function view(User $user, Issue $issue): bool
    {
        return true;
    }

    public function update(User $user, Issue $issue): bool
    {
        return $user->id === $issue->created_by
            || $user->hasRole('admin');
    }

    public function delete(User $user, Issue $issue): bool
    {
        return $user->hasRole('admin');
    }

    public function close(User $user, Issue $issue): bool
    {
        return $user->can('update', $issue);
    }
}
```

### Using Policies

```php
// In Controller
$this->authorize('update', $issue);

// In Blade
@can('update', $issue)
    <button>Edit</button>
@elsecan('delete', $issue)
    <button>Delete</button>
@endcan

// Check if user can do something
@if(Auth::user()->can('update', $issue))
    <!-- Show edit button -->
@endif
```

## Config & Environment

### Config Files

```php
// config/app.php
'env' => env('APP_ENV', 'production'),
'debug' => (bool) env('APP_DEBUG', false),
'url' => env('APP_URL', 'http://localhost'),

// Custom config
// config/issues.php
return [
    'priorities' => ['low', 'medium', 'high', 'urgent'],
    'default_priority' => 'medium',
];
```

### Environment Variables

```bash
# .env
APP_NAME="GuestPulse"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=guestpulse
DB_USERNAME=root
DB_PASSWORD=

CACHE_DRIVER=redis
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

## Artisan Commands

### Common Commands

```bash
# Create controller/model/migration
php artisan make:controller IssueController --resource
php artisan make:model Issue -m
php artisan make:migration add_status_to_issues_table

# Create Livewire component
php artisan make:livewire IssuesIndex

# Create policy/request
php artisan make:policy IssuePolicy --model=Issue
php artisan make:request StoreIssueRequest

# Database operations
php artisan migrate
php artisan migrate:fresh --seed
php artisan migrate:rollback

# Cache & Config
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Queue
php artisan queue:work
php artisan queue:listen
```

## Best Practices

1. **Route Model Binding**: Use type-hinted models instead of manual finding
2. **Service Classes**: Keep complex logic out of controllers
3. **Form Requests**: Validate with Form Request classes
4. **Eager Loading**: Prevent N+1 queries with `with()`
5. **Route Caching**: Use `route:cache` in production
6. **Config Caching**: Use `config:cache` in production
7. **Events**: Use events for side effects (emails, notifications)
8. **Jobs**: Queue long-running tasks with Jobs
9. **Accessors/Mutators**: Use for formatting model data
10. **API Resources**: Use API Resources for JSON responses

## Common Patterns

### Eager Loading

```php
// Bad - N+1 query
$issues = Issue::all();
foreach ($issues as $issue) {
    echo $issue->createdBy->name;
}

// Good - Single query with eager loading
$issues = Issue::with('createdBy')->get();
```

### Query Scopes

```php
// Chaining scopes
$issues = Issue::open()
    ->highPriority()
    ->whereHas('departments', fn($q) => $q->where('id', $deptId))
    ->get();
```

### Events & Listeners

```php
// Event
protected $listeners = [
    IssueClosed::class => ['sendClosedNotification'],
];

public function sendClosedNotification(IssueClosed $event)
{
    // Send notification
}
```
