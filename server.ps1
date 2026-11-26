param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$gameRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = $null
$serverPort = $null
foreach ($candidate in 8765..8775) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    try { $listener.Start(); $serverPort = $candidate; break } catch { $listener.Stop() }
}
if ($null -eq $serverPort) { throw 'Cannot open local server. Use VS Code Live Server instead.' }
$gameUrl = "http://localhost:$serverPort/index.html"
Write-Host "Game: $gameUrl"
Write-Host 'Keep this window open while playing. Close it to stop the server.'
if (-not $NoBrowser) { Start-Process $gameUrl }
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.png'='image/png'; '.svg'='image/svg+xml'; '.json'='application/json' }
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $null
        try {
            $stream = $client.GetStream()
            $stream.ReadTimeout = 2000
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) { continue }
            $headerSize = 0
            do { $header = $reader.ReadLine(); $headerSize += $header.Length } while ($header -and $headerSize -lt 16384)
            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) { continue }
            $relative = [System.Uri]::UnescapeDataString($parts[1].Split('?')[0]).TrimStart('/')
            if ([string]::IsNullOrEmpty($relative)) { $relative = 'index.html' }
            $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($gameRoot, $relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)))
            $status = '200 OK'
            $contentType = 'text/plain; charset=utf-8'
            $bytes = [byte[]]@()
            if ($parts[0] -notin @('GET','HEAD')) { $status = '405 Method Not Allowed' }
            elseif (-not $filePath.StartsWith($gameRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { $status = '403 Forbidden' }
            elseif (-not [System.IO.File]::Exists($filePath)) { $status = '404 Not Found' }
            else {
                $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
                $contentType = if ($types.ContainsKey($extension)) { $types[$extension] } else { 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
            }
            $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($headerBytes,0,$headerBytes.Length)
            if ($parts[0] -ne 'HEAD' -and $bytes.Length -gt 0) { $stream.Write($bytes,0,$bytes.Length) }
        } catch { Write-Host 'Request failed or connection closed.' }
        finally { if ($stream) { $stream.Dispose() }; $client.Close() }
    }
} finally { $listener.Stop() }

