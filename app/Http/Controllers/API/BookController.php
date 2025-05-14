namespace App\Http\Controllers\API;

use App\Http\Requests\StoreBookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Services\BookService;
use Illuminate\Http\JsonResponse;

class BookController extends Controller
{
    public function __construct(private BookService $bookService) 
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    public function index(): JsonResponse
    {
        $books = $this->bookService->getFilteredBooks(request()->all());
        return BookResource::collection($books)->response();
    }

    public function store(StoreBookRequest $request): JsonResponse
    {
        $book = $this->bookService->createBook($request->validated());
        return (new BookResource($book))
            ->response()
            ->setStatusCode(201);
    }
}