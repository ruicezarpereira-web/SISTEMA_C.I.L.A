 import { useState } from "react";
 import { Plus, UserCog, Mail, Shield, Trash2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { useToast } from "@/hooks/use-toast";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Skeleton } from "@/components/ui/skeleton";
 import { format } from "date-fns";
 
 interface UserWithRole {
   id: string;
   nome: string;
   email: string;
   created_at: string;
   role: string | null;
 }
 
 export default function Usuarios() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [newUser, setNewUser] = useState({
     email: '',
     nome: '',
     password: '',
     role: 'rh' as 'admin' | 'rh',
   });
 
   const { data: users, isLoading } = useQuery({
     queryKey: ['users-with-roles'],
     queryFn: async () => {
       const { data: profiles, error: profError } = await supabase
         .from('profiles')
         .select('*');
       
       if (profError) throw profError;
 
       const { data: roles, error: rolesError } = await supabase
         .from('user_roles')
         .select('*');
 
       if (rolesError) throw rolesError;
 
       const usersWithRoles: UserWithRole[] = profiles.map(profile => ({
         id: profile.user_id,
         nome: profile.nome,
         email: profile.email,
         created_at: profile.created_at,
         role: roles.find(r => r.user_id === profile.user_id)?.role || null,
       }));
 
       return usersWithRoles;
     },
   });
 
   const createUser = useMutation({
     mutationFn: async (userData: typeof newUser) => {
       // Create user via Supabase Auth
       const { data: authData, error: authError } = await supabase.auth.signUp({
         email: userData.email,
         password: userData.password,
         options: {
           emailRedirectTo: window.location.origin,
           data: { nome: userData.nome },
         },
       });
 
       if (authError) throw authError;
       if (!authData.user) throw new Error('Falha ao criar usuário');
 
       // Add role
       const { error: roleError } = await supabase
         .from('user_roles')
         .insert({
           user_id: authData.user.id,
           role: userData.role,
         });
 
       if (roleError) throw roleError;
 
       // Log activity
       await supabase.from('logs_atividade').insert({
         tipo_acao: 'USUARIO_CRIADO',
         detalhes: `Usuário ${userData.email} criado com perfil ${userData.role}`,
       });
 
       return authData.user;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
       toast({ title: "Usuário criado com sucesso!" });
       setIsDialogOpen(false);
       setNewUser({ email: '', nome: '', password: '', role: 'rh' });
     },
     onError: (error: Error) => {
       toast({ 
         title: "Erro ao criar usuário", 
         description: error.message, 
         variant: "destructive" 
       });
     },
   });
 
   const handleCreateUser = () => {
     if (!newUser.email || !newUser.nome || !newUser.password) {
       toast({
         title: "Dados incompletos",
         description: "Preencha todos os campos obrigatórios",
         variant: "destructive",
       });
       return;
     }
     createUser.mutate(newUser);
   };
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
           <p className="text-muted-foreground">
             Gerencie os usuários do sistema
           </p>
         </div>
 
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="h-4 w-4 mr-2" />
               Novo Usuário
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Criar Novo Usuário</DialogTitle>
               <DialogDescription>
                 Adicione um novo usuário ao sistema
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label htmlFor="nome">Nome</Label>
                 <Input
                   id="nome"
                   value={newUser.nome}
                   onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))}
                   placeholder="Nome completo"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <Input
                   id="email"
                   type="email"
                   value={newUser.email}
                   onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                   placeholder="email@transalvador.gov.br"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="password">Senha</Label>
                 <Input
                   id="password"
                   type="password"
                   value={newUser.password}
                   onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                   placeholder="Mínimo 6 caracteres"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="role">Perfil</Label>
                 <Select 
                   value={newUser.role} 
                   onValueChange={(v: 'admin' | 'rh') => setNewUser(prev => ({ ...prev, role: v }))}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="rh">RH (Visualização)</SelectItem>
                     <SelectItem value="admin">Administrador</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                 Cancelar
               </Button>
               <Button onClick={handleCreateUser} disabled={createUser.isPending}>
                 {createUser.isPending ? "Criando..." : "Criar Usuário"}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <UserCog className="h-5 w-5" />
             Usuários Cadastrados
           </CardTitle>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nome</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Perfil</TableHead>
                 <TableHead>Criado em</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                   <TableRow key={i}>
                     {Array.from({ length: 4 }).map((_, j) => (
                       <TableCell key={j}>
                         <Skeleton className="h-4 w-full" />
                       </TableCell>
                     ))}
                   </TableRow>
                 ))
               ) : users?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-10">
                     <UserCog className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                     <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                   </TableCell>
                 </TableRow>
               ) : (
                 users?.map((user) => (
                   <TableRow key={user.id}>
                     <TableCell className="font-medium">{user.nome}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Mail className="h-4 w-4 text-muted-foreground" />
                         {user.email}
                       </div>
                     </TableCell>
                     <TableCell>
                       {user.role ? (
                         <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                           <Shield className="h-3 w-3 mr-1" />
                           {user.role === 'admin' ? 'Administrador' : 'RH'}
                         </Badge>
                       ) : (
                         <Badge variant="outline">Sem perfil</Badge>
                       )}
                     </TableCell>
                     <TableCell>
                       {format(new Date(user.created_at), 'dd/MM/yyyy')}
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
     </div>
   );
 }