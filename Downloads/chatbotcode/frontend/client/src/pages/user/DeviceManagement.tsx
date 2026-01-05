import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Plus, 
  Server, 
  Laptop, 
  Monitor,
  Eye,
  Trash2
} from "lucide-react";
import type { Device } from "@shared/schema";

export default function DeviceManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      return apiRequest("DELETE", `/api/devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Success",
        description: "Device deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDevice = (deviceId: number) => {
    if (confirm("Are you sure you want to delete this device?")) {
      deleteDeviceMutation.mutate(deviceId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "server":
        return <Server className="h-5 w-5" />;
      case "laptop":
        return <Laptop className="h-5 w-5" />;
      case "desktop":
        return <Monitor className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffMs = now.getTime() - seen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  // Filter devices based on search and filters
  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (device.owner?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (device.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
    const matchesType = typeFilter === "all" || device.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Count devices by type
  const serverCount = devices.filter((d) => d.type === "server").length;
  const laptopCount = devices.filter((d) => d.type === "laptop").length;
  const desktopCount = devices.filter((d) => d.type === "desktop").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
        <p className="text-gray-600">Monitor and manage client devices</p>
      </div>

      {/* Device Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Device Inventory</CardTitle>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
          <p className="text-sm text-gray-600">View and manage all monitored devices</p>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search devices..."
                className="w-64 pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device Type Filters */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              onClick={() => setTypeFilter("all")}
              className={typeFilter === "all" ? "bg-primary" : ""}
            >
              All <Badge className="ml-2">{devices.length}</Badge>
            </Button>
            <Button
              variant={typeFilter === "server" ? "default" : "outline"}
              onClick={() => setTypeFilter("server")}
            >
              <Server className="mr-2 h-4 w-4" />
              Servers <Badge className="ml-2">{serverCount}</Badge>
            </Button>
            <Button
              variant={typeFilter === "laptop" ? "default" : "outline"}
              onClick={() => setTypeFilter("laptop")}
            >
              <Laptop className="mr-2 h-4 w-4" />
              Laptops <Badge className="ml-2">{laptopCount}</Badge>
            </Button>
            <Button
              variant={typeFilter === "desktop" ? "default" : "outline"}
              onClick={() => setTypeFilter("desktop")}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Desktops <Badge className="ml-2">{desktopCount}</Badge>
            </Button>
          </div>

          {/* Device Cards */}
          {isLoading ? (
            <div className="text-center py-8">Loading devices...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No devices found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <Card key={device.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-primary mr-3">
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{device.name}</h4>
                          <p className="text-sm text-gray-500">{device.owner || device.department}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Seen</span>
                        <span className="text-gray-900">{formatLastSeen(device.lastSeen?.toString() || null)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IP Address</span>
                        <span className="text-gray-900">{device.ipAddress || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Operating System</span>
                        <span className="text-gray-900 text-right">{device.operatingSystem || "Unknown"}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDeleteDevice(device.id)}
                        disabled={deleteDeviceMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
