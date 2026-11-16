<?php

function snap_is_local_api_hostname($hostname)
{
    $hostname = strtolower(trim($hostname, '[]'));

    return in_array($hostname, array('localhost', '127.0.0.1', '::1'), true)
        || substr($hostname, -10) === '.localhost'
        || substr($hostname, -5) === '.test';
}

function snap_is_local_development_request()
{
    $requestHost = isset($_SERVER['HTTP_HOST'])
        ? $_SERVER['HTTP_HOST']
        : (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : '');
    $requestHost = trim($requestHost);
    $requestHost = preg_replace('/:\d+$/', '', $requestHost);

    return snap_is_local_api_hostname($requestHost);
}

function snap_resolve_api_url($environmentVariable, $localDefault)
{
    $isLocalRequest = snap_is_local_development_request();
    $configuredUrl = getenv($environmentVariable);

    if ($configuredUrl === false || trim($configuredUrl) === '') {
        return $isLocalRequest ? $localDefault : '';
    }

    $configuredUrl = trim($configuredUrl);
    if (preg_match('/[\r\n\\\\]/', $configuredUrl)) {
        error_log('SNAP API endpoint configuration is invalid for ' . $environmentVariable . '.');
        return '';
    }

    if (substr($configuredUrl, 0, 1) === '/') {
        if (substr($configuredUrl, 0, 2) !== '//'
            && preg_match('~^/api(?:/|$)~', $configuredUrl)) {
            return $configuredUrl;
        }

        error_log('SNAP API endpoint for ' . $environmentVariable . ' must be an /api path.');
        return '';
    }

    $parts = parse_url($configuredUrl);
    if (!is_array($parts)
        || !isset($parts['scheme'])
        || !isset($parts['host'])
        || isset($parts['user'])
        || isset($parts['pass'])) {
        error_log('SNAP API endpoint configuration is invalid for ' . $environmentVariable . '.');
        return '';
    }

    $scheme = strtolower($parts['scheme']);
    $endpointHost = $parts['host'];
    if ($isLocalRequest
        && ($scheme === 'http' || $scheme === 'https')) {
        return $configuredUrl;
    }

    if ($scheme === 'https' && !snap_is_local_api_hostname($endpointHost)) {
        return $configuredUrl;
    }

    error_log(
        'SNAP API endpoint for ' . $environmentVariable
        . ' must use HTTPS or a same-origin /api path outside local development.'
    );
    return '';
}
