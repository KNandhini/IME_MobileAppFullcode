import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  FileText, 
  Clock, 
  User, 
  Calendar
} from "lucide-react";
import type { Sop } from "@shared/schema";

export default function SOPs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const { data: sops = [], isLoading } = useQuery<Sop[]>({
    queryKey: ["/api/sops"],
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const formatEstimatedTime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  // Filter SOPs based on search and filters
  const filteredSops = sops.filter((sop: Sop) => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || sop.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || sop.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get unique categories
  const categories = Array.from(new Set(sops.map((sop: Sop) => sop.category)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Standard Operating Procedures</h1>
        <p className="text-gray-600">Access and search through documented procedures and guides</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SOPs by title or description..."
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOPs Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading SOPs...</div>
      ) : filteredSops.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No SOPs found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSops.map((sop: Sop) => (
            <Card key={sop.id} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="text-primary mr-3 h-6 w-6" />
                    <Badge className={getDifficultyColor(sop.difficulty)}>
                      {formatDifficulty(sop.difficulty)}
                    </Badge>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">{sop.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{sop.description}</p>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center text-gray-500">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{formatEstimatedTime(sop.estimatedTime)}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <User className="mr-2 h-4 w-4" />
                    <span>Author #{sop.authorId}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Last updated: {sop.updatedAt ? new Date(sop.updatedAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {sop.category}
                  </Badge>
                </div>
                
                <Button className="w-full bg-primary hover:bg-primary/90">
                  View SOP
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
