<h1 align="center">ClusterWS</h1>

This page contains some benchmark (with ways to reproduce). Some of that is stupid bench which should not be even included in any benchmarks but everyone uses it. Mainly this is for developers to track degradation of the code.

**Need to add BENCH PC INFO PROPERLY**

All bench done on arch linux.

## HTTP Req/Sec throughput with and without proper scaling 

This bench is just to test raw HTTP throughput (Node.js) in different scale condition. Fro all below we used `wrk -t4 -c1000 -d10s --latency http://127.0.0.1:3000`

```
1 Worker: 

Running 10s test @ http://127.0.0.1:3000
  4 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    31.11ms  121.38ms   2.00s    97.77%
    Req/Sec     9.17k     2.07k   14.36k    71.43%
  Latency Distribution
     50%   16.07ms
     75%   19.97ms
     90%   22.25ms
     99%  685.86ms
  364281 requests in 10.07s, 91.37MB read
  Socket errors: connect 0, read 0, write 0, timeout 498
Requests/sec:  36185.65
Transfer/sec:      9.08MB
```

```
2 Workers:

Running 10s test @ http://127.0.0.1:3000
  4 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    53.30ms  186.56ms   2.00s    94.68%
    Req/Sec    17.80k     2.65k   22.47k    88.00%
  Latency Distribution
     50%   13.25ms
     75%   14.51ms
     90%   16.48ms
     99%    1.10s 
  708369 requests in 10.06s, 177.67MB read
  Socket errors: connect 0, read 0, write 0, timeout 93
Requests/sec:  70448.90
Transfer/sec:     17.67MB
```

```
Max available (bound to CPU number) Workers:

Running 10s test @ http://127.0.0.1:3000
  4 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.28ms   56.20ms 706.09ms   97.11%
    Req/Sec    40.51k     7.85k   64.00k    86.29%
  Latency Distribution
     50%    5.39ms
     75%    6.58ms
     90%    9.37ms
     99%  359.18ms
  1599388 requests in 10.05s, 401.15MB read
Requests/sec: 159184.76
Transfer/sec:     39.93MB
```