import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreVertical,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Heart,
  Share2,
  ExternalLink,
  CheckSquare,
  Archive,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import DataTable from '../ui/DataTable';
import BlogForm from './BlogForm';
import blogAPI from '../../services/api/blogAPI';

interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  featuredImage: string;
  category: {
    _id: string;
    name: string;
    color: string;
  };
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const [filters, setFilters] = useState<BlogFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [filters]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.admin.getAllBlogs(filters);
      setBlogs(response.data.blogs);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await blogAPI.admin.getAllCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateBlog = () => {
    setSelectedBlog(null);
    setShowBlogForm(true);
  };

  const handleEditBlog = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowBlogForm(true);
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await blogAPI.admin.deleteBlog(blogId);
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  const handleSubmitBlog = async (data: any) => {
    try {
      if (selectedBlog) {
        await blogAPI.admin.updateBlog(selectedBlog._id, data);
      } else {
        await blogAPI.admin.createBlog(data);
      }
      fetchBlogs();
    } catch (error) {
      throw error;
    }
  };

  const handleFilterChange = (key: keyof BlogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  const handleSelectBlog = (blogId: string) => {
    setSelectedBlogs(prev =>
      prev.includes(blogId)
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBlogs(prev =>
      prev.length === blogs.length
        ? []
        : blogs.map(blog => blog._id)
    );
  };

  const handleBulkPublish = async () => {
    if (selectedBlogs.length === 0) return;

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedBlogs.map(blogId =>
          blogAPI.admin.updateBlog(blogId, { status: 'published' })
        )
      );
      toast.success(`${selectedBlogs.length} blogs published successfully`);
      setSelectedBlogs([]);
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to publish blogs');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedBlogs.length === 0) return;

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedBlogs.map(blogId =>
          blogAPI.admin.updateBlog(blogId, { status: 'archived' })
        )
      );
      toast.success(`${selectedBlogs.length} blogs archived successfully`);
      setSelectedBlogs([]);
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to archive blogs');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedBlogs.length} blog posts?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedBlogs.map(blogId => blogAPI.admin.deleteBlog(blogId))
      );
      toast.success(`${selectedBlogs.length} blogs deleted successfully`);
      setSelectedBlogs([]);
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blogs');
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      published: 'success',
      archived: 'warning'
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedBlogs.length === blogs.length && blogs.length > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      ),
      render: (blog: Blog) => (
        <input
          type="checkbox"
          checked={selectedBlogs.includes(blog._id)}
          onChange={() => handleSelectBlog(blog._id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      )
    },
    {
      key: 'title',
      label: 'Title',
      render: (blog: Blog) => (
        <div className="flex items-start space-x-3">
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/blog/placeholder.svg';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {blog.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {blog.excerpt}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-400">
                by {blog.author.name}
              </span>
              {blog.featured && (
                <Badge variant="primary" size="sm">Featured</Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (blog: Blog) => (
        <Badge
          variant="secondary"
          style={{ backgroundColor: blog.category.color + '20', color: blog.category.color }}
        >
          {blog.category.name}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (blog: Blog) => getStatusBadge(blog.status)
    },
    {
      key: 'stats',
      label: 'Stats',
      render: (blog: Blog) => (
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {blog.viewCount}
          </div>
          <div className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            {blog.likeCount}
          </div>
          <div className="flex items-center">
            <Share2 className="w-4 h-4 mr-1" />
            {blog.shareCount}
          </div>
        </div>
      )
    },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (blog: Blog) => (
        <div className="text-sm text-gray-500">
          {blog.publishedAt ? formatDate(blog.publishedAt) : 'Not published'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (blog: Blog) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEditBlog(blog)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteBlog(blog._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-sm text-gray-600">
            Manage your blog posts and categories
          </p>
        </div>
        <Button onClick={handleCreateBlog}>
          <Plus className="w-4 h-4 mr-2" />
          Create Blog Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{pagination.totalBlogs}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {blogs.filter(b => b.status === 'published').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold">
                  {blogs.filter(b => b.status === 'draft').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="publishedAt-desc">Recently Published</option>
                <option value="viewCount-desc">Most Viewed</option>
                <option value="likeCount-desc">Most Liked</option>
                <option value="title-asc">Title A-Z</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedBlogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedBlogs.length} blog{selectedBlogs.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkPublish}
                  loading={bulkLoading}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Publish
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkArchive}
                  loading={bulkLoading}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  loading={bulkLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={blogs}
            loading={loading}
            pagination={{
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              onPageChange: (page) => handleFilterChange('page', page)
            }}
          />
        </CardContent>
      </Card>

      {/* Blog Form Modal */}
      <BlogForm
        blog={selectedBlog}
        isOpen={showBlogForm}
        onClose={() => setShowBlogForm(false)}
        onSubmit={handleSubmitBlog}
        categories={categories}
      />
    </div>
  );
};

export default BlogList;