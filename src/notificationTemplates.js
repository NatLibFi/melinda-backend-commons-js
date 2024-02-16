export function generateBlobNotification({
  profile = '',
  id = '',
  correlationId = '',
  numberOfRecords = 0,
  failedRecords = 0,
  processedRecords = 0,
  created = 0,
  updated = 0,
  skipped = 0,
  error = 0
}, {environment = false, baseUrl = ''}) {
  return {
    'blocks':
      [
        {
          'type': 'header',
          'text':
          {
            'type': 'plain_text',
            'text': `${environment ? `${environment} - ` : ''}Record import blob: ${profile}`,
            'emoji': true
          }
        },
        {
          'type': 'divider'
        },
        {
          'type': 'rich_text',
          'elements':
            [
              {
                'type': 'rich_text_list',
                'style': 'bullet',
                'elements':
                  [
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Id: '
                          },
                          {
                            'type': 'text',
                            'text': `${id}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Correlation id: '
                          },
                          {
                            'type': 'link',
                            'url': `${baseUrl}/?id=${correlationId}`,
                            'text': `${correlationId}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Number of records: '
                          },
                          {
                            'type': 'text',
                            'text': `${numberOfRecords}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Failed records: '
                          },
                          {
                            'type': 'text',
                            'text': `${failedRecords}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Processed records: '
                          },
                          {
                            'type': 'text',
                            'text': `${processedRecords}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Created records: '
                          },
                          {
                            'type': 'text',
                            'text': `${created}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Updated records: '
                          },
                          {
                            'type': 'text',
                            'text': `${updated}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Skipped records: '
                          },
                          {
                            'type': 'text',
                            'text': `${skipped}`
                          }
                        ]
                    },
                    {
                      'type': 'rich_text_section',
                      'elements':
                        [
                          {
                            'type': 'text',
                            'text': 'Error records: '
                          },
                          {
                            'type': 'text',
                            'text': `${error}`
                          }
                        ]
                    }
                  ]
              }
            ]
        },
        {
          'type': 'divider'
        }
      ]
  };
}
