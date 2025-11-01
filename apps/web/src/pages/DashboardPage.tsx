import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.getAnalytics(),
  });

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const tagStats = data?.tagStats || [];

  const handleExportCSV = () => {
    api.getAnalyticsCSV();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tasksCompletedToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tasksCompleted7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.completionRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.streak || 0} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Spent by Tag</CardTitle>
          </CardHeader>
          <CardContent>
            {charts.timeByTag && charts.timeByTag.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.timeByTag}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.tagName}: ${Math.round(entry.minutes / 60)}h`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="minutes"
                  >
                    {charts.timeByTag.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Burn-down (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            {charts.burnDown && charts.burnDown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.burnDown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tag-based Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Tag-Based Analytics</h2>
        
        {/* Tag Statistics Cards */}
        {tagStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tagStats.map((tag: any) => (
              <Card key={tag.tagId} style={{ borderLeft: `4px solid ${tag.tagColor}` }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.tagColor }}
                    />
                    <CardTitle className="text-base font-semibold">{tag.tagName}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tasks:</span>
                    <span className="font-medium">{tag.totalTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">{tag.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">In Progress:</span>
                    <span className="font-medium text-orange-600">{tag.inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To Do:</span>
                    <span className="font-medium text-blue-600">{tag.todo}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion:</span>
                      <span className="font-bold">{tag.completionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Time: {Math.round(tag.totalTimeMinutes / 60)}h</span>
                    <span>Est: {Math.round(tag.estimatedTimeMinutes / 60)}h</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tag Performance Bar Chart */}
        {tagStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tagStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tagName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                  <Bar dataKey="inProgress" stackId="a" fill="#F59E0B" name="In Progress" />
                  <Bar dataKey="todo" stackId="a" fill="#3B82F6" name="To Do" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tag Completion Rate Chart */}
        {tagStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate by Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tagStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tagName" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="completionRate">
                    {tagStats.map((tag: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={tag.tagColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

