import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserCheck, UserX, Shield, Edit2, Trash2, UserPlus, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getBackendAdapter } from '@/config/backend-config';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor';
  created_at: string;
  last_sign_in_at?: string;
  updated_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const backend = getBackendAdapter();

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'editor' as 'admin' | 'editor'
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backend.config.apiUrl}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor') => {
    try {
      setUpdating(userId);
      const response = await fetch(`${backend.config.apiUrl}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`
        });
        fetchUsers(); // Refresh list
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update role');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setUpdating(null);
    }
  };

  const deactivateUser = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch(`${backend.config.apiUrl}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${userEmail} has been deactivated`
        });
        fetchUsers(); // Refresh list
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to deactivate user');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required"
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long"
      });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${backend.config.apiUrl}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${newUser.email} has been created`
        });

        // Reset form
        setNewUser({
          email: '',
          password: '',
          full_name: '',
          role: 'editor'
        });

        setShowCreateForm(false);
        fetchUsers(); // Refresh list
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentUser = (userId: string) => userId === currentUser?.id;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Admin access required to manage users</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2"
              variant={showCreateForm ? "outline" : "default"}
            >
              {showCreateForm ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add User
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create User Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Create New User</CardTitle>
                <CardDescription>
                  Add a new user account with email and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="At least 8 characters"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 characters required
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: 'admin' | 'editor') => setNewUser(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={creating} className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      {creating ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="font-medium">{user.full_name || 'No name'}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {isCurrentUser(user.id) && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {formatDate(user.created_at)}</span>
                      {user.last_sign_in_at && (
                        <span>Last login: {formatDate(user.last_sign_in_at)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge & Selector */}
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>

                      {!isCurrentUser(user.id) && (
                        <Select
                          value={user.role}
                          onValueChange={(newRole: 'admin' | 'editor') => updateUserRole(user.id, newRole)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-20 h-7">
                            <Edit2 className="w-3 h-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Deactivate Button */}
                    {!isCurrentUser(user.id) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deactivate <strong>{user.email}</strong>?
                              This will prevent them from logging in, but their data will be preserved.
                              This action cannot be undone through the interface.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deactivateUser(user.id, user.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <Button onClick={fetchUsers} variant="outline" size="sm">
              Refresh List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}