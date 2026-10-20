import { DealerSocialIntegration } from '../db/types';

export interface MetaPublishResult {
  success: boolean;
  channel: 'facebook' | 'instagram';
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface PublishFacebookParams {
  pageId: string;
  accessToken: string;
  message: string;
  imageUrls: string[];
}

export interface PublishInstagramParams {
  igUserId: string;
  accessToken: string;
  caption: string;
  imageUrls: string[];
}

/**
 * Asigură transformarea căilor relative în URL-uri absolute HTTPS pentru crawlerele Meta
 */
export function ensureAbsoluteImageUrl(url: string, baseUrl?: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const host = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://rxmautomobile.ro');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${host}${cleanPath}`;
}

/**
 * Validează dacă există date de configurare suficiente pentru Meta Graph API
 */
export function validateMetaConfig(config?: DealerSocialIntegration): {
  canPublishFb: boolean;
  canPublishIg: boolean;
  missingFb: string[];
  missingIg: string[];
} {
  const missingFb: string[] = [];
  const missingIg: string[] = [];

  if (!config?.facebookPageId) missingFb.push('Facebook Page ID');
  if (!config?.facebookPageAccessToken) missingFb.push('Facebook Page Access Token');

  if (!config?.instagramBusinessAccountId) missingIg.push('Instagram Business Account ID');
  if (!config?.facebookPageAccessToken) missingIg.push('Page Access Token (pentru Instagram Graph)');

  return {
    canPublishFb: missingFb.length === 0,
    canPublishIg: missingIg.length === 0,
    missingFb,
    missingIg
  };
}

/**
 * Publicare directă pe Pagina de Facebook prin Meta Graph API v19.0
 * Dacă există mai multe imagini, încarcă imaginile ca unpublished photos și le leagă la un feed post cu attached_media.
 */
export async function publishToFacebookPage(params: PublishFacebookParams): Promise<MetaPublishResult> {
  const { pageId, accessToken, message, imageUrls } = params;

  if (!pageId || !accessToken) {
    return {
      success: false,
      channel: 'facebook',
      error: 'Lipsesc ID-ul de pagină sau Token-ul de acces Facebook.'
    };
  }

  try {
    const validImageUrls = imageUrls.slice(0, 10).map(url => ensureAbsoluteImageUrl(url));

    // Cazul 1: Fără imagini sau o singură imagine
    if (validImageUrls.length <= 1) {
      const endpoint = validImageUrls.length === 1
        ? `https://graph.facebook.com/v19.0/${pageId}/photos`
        : `https://graph.facebook.com/v19.0/${pageId}/feed`;

      const bodyData: Record<string, string> = {
        access_token: accessToken,
        [validImageUrls.length === 1 ? 'caption' : 'message']: message
      };
      if (validImageUrls.length === 1) {
        bodyData.url = validImageUrls[0];
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        return {
          success: false,
          channel: 'facebook',
          error: data.error?.message || `Eroare HTTP ${res.status} la publicarea pe Facebook.`
        };
      }

      const postId = data.id || data.post_id;
      return {
        success: true,
        channel: 'facebook',
        postId,
        postUrl: `https://www.facebook.com/${postId}`
      };
    }

    // Cazul 2: Postare album multi-foto (până la 10 fotografii)
    const uploadedMediaIds: string[] = [];

    for (const imgUrl of validImageUrls) {
      const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imgUrl,
          published: false,
          access_token: accessToken
        })
      });
      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        uploadedMediaIds.push(uploadData.id);
      }
    }

    if (uploadedMediaIds.length === 0) {
      throw new Error('Nu s-a putut încărca nicio fotografie pe serverele Facebook.');
    }

    // Creare postare principală în feed cu media atașată
    const attachedMedia = uploadedMediaIds.map(id => ({ media_fbid: id }));
    const feedRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        attached_media: attachedMedia,
        access_token: accessToken
      })
    });
    const feedData = await feedRes.json();

    if (!feedRes.ok || feedData.error) {
      return {
        success: false,
        channel: 'facebook',
        error: feedData.error?.message || `Eroare HTTP ${feedRes.status} la crearea postării pe Facebook.`
      };
    }

    const postId = feedData.id;
    return {
      success: true,
      channel: 'facebook',
      postId,
      postUrl: `https://www.facebook.com/${postId}`
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      channel: 'facebook',
      error: `Eroare conexiune Meta Graph: ${errorMsg}`
    };
  }
}

/**
 * Publicare directă Carusel Instagram prin Instagram Graph API v19.0
 * Flux în 3 pași: Creare item containere -> Creare container carusel -> Publicare container.
 */
export async function publishToInstagramCarousel(params: PublishInstagramParams): Promise<MetaPublishResult> {
  const { igUserId, accessToken, caption, imageUrls } = params;

  if (!igUserId || !accessToken) {
    return {
      success: false,
      channel: 'instagram',
      error: 'Lipsesc ID-ul de utilizator Instagram Business sau Token-ul de acces.'
    };
  }

  const validImageUrls = imageUrls.slice(0, 10).map(url => ensureAbsoluteImageUrl(url));
  if (validImageUrls.length === 0) {
    return {
      success: false,
      channel: 'instagram',
      error: 'Sunt necesare cel puțin o fotografie pentru a publica pe Instagram.'
    };
  }

  try {
    // 1. Creare containere pentru fiecare imagine din carusel
    const childContainerIds: string[] = [];

    for (const imgUrl of validImageUrls) {
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imgUrl,
          is_carousel_item: true,
          access_token: accessToken
        })
      });
      const containerData = await containerRes.json();
      if (!containerRes.ok || !containerData.id) {
        throw new Error(containerData.error?.message || `Eroare la crearea containerului Instagram pentru imagine.`);
      }
      childContainerIds.push(containerData.id);
    }

    // 2. Creare container principal de tip carusel
    const carouselRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childContainerIds.join(','),
        caption,
        access_token: accessToken
      })
    });
    const carouselData = await carouselRes.json();
    if (!carouselRes.ok || !carouselData.id) {
      throw new Error(carouselData.error?.message || `Eroare la crearea caruselului Instagram.`);
    }

    const carouselContainerId = carouselData.id;

    // 3. Publicare efectivă a caruselului
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: carouselContainerId,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      throw new Error(publishData.error?.message || `Eroare la publicarea finală pe Instagram.`);
    }

    const publishedMediaId = publishData.id;

    // 4. Încercare de obținere permalink Instagram
    let permalink = `https://www.instagram.com/`;
    try {
      const linkRes = await fetch(`https://graph.facebook.com/v19.0/${publishedMediaId}?fields=permalink&access_token=${accessToken}`);
      const linkData = await linkRes.json();
      if (linkData.permalink) {
        permalink = linkData.permalink;
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      channel: 'instagram',
      postId: publishedMediaId,
      postUrl: permalink
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      channel: 'instagram',
      error: `Eroare Instagram Graph API: ${errorMsg}`
    };
  }
}
